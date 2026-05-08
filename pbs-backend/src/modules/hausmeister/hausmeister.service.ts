import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Prisma } from '@prisma/client';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import type { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import type {
  CreateHausmeisterEinsatzDto,
  UpdateHausmeisterEinsatzDto,
} from './dto/hausmeister.dto';
import { AccessPolicyService } from '../access-policy/access-policy.service';
import type { AccessPolicyAuth } from '../access-policy/access-policy.service';

@Injectable()
export class HausmeisterService {
  private readonly logger = new Logger(HausmeisterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: AccessPolicyService,
  ) {}

  async alleEinsaetzeLaden(
    pagination: PaginationDto,
    filter?: { q?: string; mitarbeiter?: string; monat?: string },
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const query = filter?.q?.trim();
    const mitarbeiter = filter?.mitarbeiter?.trim();
    const monat = filter?.monat?.trim();

    const monatRange =
      monat && /^\d{4}-\d{2}$/.test(monat)
        ? (() => {
            const [y, m] = monat.split('-').map(Number);
            const start = new Date(y, m - 1, 1);
            const end = new Date(y, m, 1);
            return { start, end };
          })()
        : null;

    const where =
      query || mitarbeiter || monatRange
        ? {
            AND: [
              mitarbeiter ? { mitarbeiter_name: mitarbeiter } : {},
              monatRange
                ? { datum: { gte: monatRange.start, lt: monatRange.end } }
                : {},
              query
                ? {
                    OR: [
                      {
                        mitarbeiter_name: {
                          contains: query,
                          mode: 'insensitive' as const,
                        },
                      },
                      {
                        kunden_name: {
                          contains: query,
                          mode: 'insensitive' as const,
                        },
                      },
                      {
                        notiz: {
                          contains: query,
                          mode: 'insensitive' as const,
                        },
                      },
                    ],
                  }
                : {},
            ],
          }
        : undefined;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.hausmeisterEinsaetze.findMany({
        where,
        orderBy: { datum: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.hausmeisterEinsaetze.count({ where }),
    ]);
    return {
      data: rows.map((e) => this.mapEinsatz(e)),
      total,
      page,
      pageSize,
    };
  }

  async einsaetzeFuerMitarbeiterLaden(
    mitarbeiterId: number,
    auth: AccessPolicyAuth,
  ) {
    await this.accessPolicy.assertCanAccessEmployee(auth, mitarbeiterId);
    const rows = await this.prisma.hausmeisterEinsaetze.findMany({
      where: { mitarbeiter_id: BigInt(mitarbeiterId) },
      orderBy: { datum: 'desc' },
      take: 1000,
    });
    return rows.map((e) => this.mapEinsatz(e));
  }

  async einsatzErstellen(d: CreateHausmeisterEinsatzDto) {
    const taetigkeiten: Prisma.JsonArray = (d.taetigkeiten ?? []).map(
      (entry) => entry,
    );
    const e = await this.prisma.hausmeisterEinsaetze.create({
      data: {
        mitarbeiter_id: d.mitarbeiter_id ? BigInt(d.mitarbeiter_id) : null,
        mitarbeiter_name: d.mitarbeiter_name,
        kunden_id: d.kunden_id ? BigInt(d.kunden_id) : null,
        kunden_name: d.kunden_name ?? null,
        datum: new Date(d.datum),
        taetigkeiten,
        stunden_gesamt: new Prisma.Decimal(d.stunden_gesamt),
        notiz: d.notiz ?? null,
        abgeschlossen: d.abgeschlossen ?? false,
      },
    });
    return this.mapEinsatz(e);
  }

  async einsatzAktualisieren(id: number, d: UpdateHausmeisterEinsatzDto) {
    if (
      !(await this.prisma.hausmeisterEinsaetze.findUnique({
        where: { id: BigInt(id) },
      }))
    )
      throw new NotFoundException();
    const taetigkeiten: Prisma.JsonArray = (d.taetigkeiten ?? []).map(
      (entry) => entry,
    );
    const e = await this.prisma.hausmeisterEinsaetze.update({
      where: { id: BigInt(id) },
      data: {
        mitarbeiter_id: d.mitarbeiter_id ? BigInt(d.mitarbeiter_id) : null,
        mitarbeiter_name: d.mitarbeiter_name,
        kunden_id: d.kunden_id ? BigInt(d.kunden_id) : null,
        kunden_name: d.kunden_name ?? null,
        datum: new Date(d.datum),
        taetigkeiten,
        stunden_gesamt: new Prisma.Decimal(d.stunden_gesamt),
        notiz: d.notiz ?? null,
        abgeschlossen: d.abgeschlossen ?? false,
      },
    });
    return this.mapEinsatz(e);
  }

  async einsatzLoeschen(id: number) {
    if (
      !(await this.prisma.hausmeisterEinsaetze.findUnique({
        where: { id: BigInt(id) },
      }))
    )
      throw new NotFoundException();
    await this.prisma.hausmeisterEinsaetze.delete({
      where: { id: BigInt(id) },
    });
    return { ok: true };
  }

  private mapEinsatz(e: Record<string, unknown>) {
    return {
      ...e,
      id: Number(e['id']),
      mitarbeiter_id: e['mitarbeiter_id'] ? Number(e['mitarbeiter_id']) : null,
      kunden_id: e['kunden_id'] ? Number(e['kunden_id']) : null,
      stunden_gesamt: Number(e['stunden_gesamt']),
      datum:
        e['datum'] instanceof Date
          ? e['datum'].toISOString().slice(0, 10)
          : e['datum'],
    };
  }
}
