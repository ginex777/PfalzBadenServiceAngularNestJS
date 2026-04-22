import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';
import { Prisma, Rechnungen } from '@prisma/client';
import { CreateRechnungDto, UpdateRechnungDto } from './dto/rechnung.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

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
      data: this.mapData(daten),
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
    if (daten.nr !== alt.nr) {
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
      data: this.mapData(daten),
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

  private mapData(d: CreateRechnungDto): Prisma.RechnungenCreateInput {
    return {
      nr: d.nr,
      empf: d.empf,
      str: d.str ?? null,
      ort: d.ort ?? null,
      titel: d.titel ?? null,
      datum: d.datum ? new Date(d.datum) : null,
      leistungsdatum: d.leistungsdatum ?? null,
      email: d.email ?? null,
      zahlungsziel: d.zahlungsziel ?? 14,
      kunden: d.kunden_id
        ? { connect: { id: BigInt(d.kunden_id) } }
        : undefined,
      brutto: new Prisma.Decimal(d.brutto),
      frist: d.frist ? new Date(d.frist) : null,
      bezahlt: d.bezahlt ?? false,
      bezahlt_am: d.bezahlt_am ? new Date(d.bezahlt_am) : null,
      positionen:
        (d.positionen as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
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
