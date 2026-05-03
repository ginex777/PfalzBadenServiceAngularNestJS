import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import type { PrismaService } from '../../core/database/prisma.service';
import type { AuditService } from '../../modules/audit/audit.service';
import type { Rechnungen } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { CreateRechnungDto, UpdateRechnungDto } from './dto/rechnung.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import type { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  calculateBillingTotals,
  calculateDueDate,
  positionsFromJson,
  positionsToJson,
} from '../billing/billing-calculations';

@Injectable()
export class RechnungenService {
  private readonly logger = new Logger(RechnungenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(
    pagination: PaginationDto,
    filter?: { q?: string; status?: string },
  ): Promise<PaginatedResponse<ReturnType<RechnungenService['mapRechnung']>>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const query = filter?.q?.trim();
    const status = filter?.status?.trim();
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);

    const statusWhere =
      status === 'offen'
        ? { bezahlt: false }
        : status === 'bezahlt'
          ? { bezahlt: true }
          : status === 'ueberfaellig'
            ? { bezahlt: false, frist: { lt: heute } }
            : undefined;

    const queryWhere =
      query && query.length > 0
        ? {
            OR: [
              { nr: { contains: query, mode: 'insensitive' as const } },
              { empf: { contains: query, mode: 'insensitive' as const } },
              { titel: { contains: query, mode: 'insensitive' as const } },
            ],
          }
        : undefined;

    const where =
      statusWhere || queryWhere
        ? {
            AND: [statusWhere ?? {}, queryWhere ?? {}],
          }
        : undefined;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.rechnungen.findMany({
        where,
        orderBy: [{ datum: 'desc' }, { id: 'desc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.rechnungen.count({ where }),
    ]);
    return {
      data: rows.map((r) => this.mapRechnung(r)),
      total,
      page,
      pageSize,
    };
  }

  async create(daten: CreateRechnungDto, nutzer?: string) {
    const vorhanden = await this.prisma.rechnungen.findUnique({
      where: { nr: daten.nr },
    });
    if (vorhanden)
      throw new ConflictException(
        `Rechnungsnummer "${daten.nr}" existiert bereits.`,
      );

    const rechnung = await this.prisma.rechnungen.create({
      data: this.mapDataCreate(daten),
    });
    await this.audit.log(
      'rechnungen',
      rechnung.id,
      'CREATE',
      null,
      rechnung,
      nutzer,
    );
    return this.mapRechnung(rechnung);
  }

  async update(id: number, daten: UpdateRechnungDto, nutzer?: string) {
    const alt = await this.prisma.rechnungen.findUnique({
      where: { id: BigInt(id) },
    });
    if (!alt) throw new NotFoundException(`Rechnung ${id} nicht gefunden`);

    // GoBD §146 AO: Bezahlte Rechnungen — nur Zahlungsstatus änderbar
    if (alt.bezahlt && daten.bezahlt !== false) {
      throw new ForbiddenException(
        'Bezahlte Rechnungen dürfen inhaltlich nicht geändert werden (GoBD §146 AO).',
      );
    }

    // Duplikat-Check bei Nr-Änderung
    if (daten.nr !== undefined && daten.nr !== alt.nr) {
      const dup = await this.prisma.rechnungen.findFirst({
        where: { nr: daten.nr, id: { not: BigInt(id) } },
      });
      if (dup)
        throw new ConflictException(
          `Rechnungsnummer "${daten.nr}" existiert bereits.`,
        );
    }

    const neu = await this.prisma.rechnungen.update({
      where: { id: BigInt(id) },
      data: this.mapData(daten, alt),
    });
    await this.audit.log('rechnungen', BigInt(id), 'UPDATE', alt, neu, nutzer);
    return this.mapRechnung(neu);
  }

  async delete(id: number, nutzer?: string) {
    const alt = await this.prisma.rechnungen.findUnique({
      where: { id: BigInt(id) },
    });
    if (!alt) throw new NotFoundException(`Rechnung ${id} nicht gefunden`);
    if (alt.bezahlt)
      throw new ForbiddenException(
        'Bezahlte Rechnungen können nicht gelöscht werden (GoBD §146 AO).',
      );
    await this.prisma.rechnungen.delete({ where: { id: BigInt(id) } });
    await this.audit.log('rechnungen', BigInt(id), 'DELETE', alt, null, nutzer);
    return { ok: true };
  }

  private mapData(
    d: UpdateRechnungDto,
    existing: Rechnungen,
  ): Prisma.RechnungenUpdateInput {
    const data: Prisma.RechnungenUpdateInput = {};
    const paymentTermDays = d.zahlungsziel ?? existing.zahlungsziel ?? 14;
    const invoiceDate =
      d.datum !== undefined
        ? d.datum
          ? new Date(d.datum)
          : null
        : existing.datum;
    const positions =
      d.positionen !== undefined
        ? d.positionen
        : positionsFromJson(existing.positionen ?? Prisma.JsonNull);
    const vatRate = d.mwst_satz ?? Number(existing.mwst_satz);
    const shouldRecalculateTotal =
      d.positionen !== undefined || d.mwst_satz !== undefined;
    const shouldRecalculateDueDate =
      d.datum !== undefined || d.zahlungsziel !== undefined;

    if (d.nr !== undefined) data.nr = d.nr;
    if (d.empf !== undefined) data.empf = d.empf;
    if (d.str !== undefined) data.str = d.str ?? null;
    if (d.ort !== undefined) data.ort = d.ort ?? null;
    if (d.titel !== undefined) data.titel = d.titel ?? null;
    if (d.datum !== undefined) data.datum = invoiceDate;
    if (d.leistungsdatum !== undefined)
      data.leistungsdatum = d.leistungsdatum ?? null;
    if (d.email !== undefined) data.email = d.email ?? null;
    if (d.zahlungsziel !== undefined) data.zahlungsziel = d.zahlungsziel;
    if (d.kunden_id !== undefined) {
      data.kunden = d.kunden_id
        ? { connect: { id: BigInt(d.kunden_id) } }
        : { disconnect: true };
    }
    if (shouldRecalculateTotal)
      data.brutto = new Prisma.Decimal(
        calculateBillingTotals(positions, vatRate).brutto,
      );
    if (shouldRecalculateDueDate)
      data.frist = calculateDueDate(invoiceDate, paymentTermDays);
    if (d.bezahlt !== undefined) data.bezahlt = d.bezahlt;
    if (d.bezahlt_am !== undefined)
      data.bezahlt_am = d.bezahlt_am ? new Date(d.bezahlt_am) : null;
    if (d.positionen !== undefined)
      data.positionen = positionsToJson(positions);
    if (d.mwst_satz !== undefined)
      data.mwst_satz = new Prisma.Decimal(d.mwst_satz);
    return data;
  }

  private mapDataCreate(d: CreateRechnungDto): Prisma.RechnungenCreateInput {
    const paymentTermDays = d.zahlungsziel ?? 14;
    const invoiceDate = d.datum ? new Date(d.datum) : null;
    const vatRate = d.mwst_satz ?? 19;
    const totals = calculateBillingTotals(d.positionen, vatRate);

    return {
      nr: d.nr,
      empf: d.empf,
      str: d.str ?? null,
      ort: d.ort ?? null,
      titel: d.titel ?? null,
      datum: invoiceDate,
      leistungsdatum: d.leistungsdatum ?? null,
      email: d.email ?? null,
      zahlungsziel: paymentTermDays,
      kunden: d.kunden_id
        ? { connect: { id: BigInt(d.kunden_id) } }
        : undefined,
      brutto: new Prisma.Decimal(totals.brutto),
      frist: calculateDueDate(invoiceDate, paymentTermDays),
      bezahlt: d.bezahlt ?? false,
      bezahlt_am: d.bezahlt_am ? new Date(d.bezahlt_am) : null,
      positionen: positionsToJson(d.positionen),
      mwst_satz: new Prisma.Decimal(d.mwst_satz ?? 19),
    };
  }

  private mapRechnung(r: Rechnungen) {
    return {
      ...r,
      id: Number(r.id),
      kunden_id: r.kunden_id ? Number(r.kunden_id) : null,
      brutto: Number(r.brutto),
      mwst_satz: Number(r.mwst_satz),
      bezahlt: Boolean(r.bezahlt),
    };
  }
}
