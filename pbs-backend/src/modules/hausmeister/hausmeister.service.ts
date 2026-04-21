import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  CreateHausmeisterEinsatzDto,
  UpdateHausmeisterEinsatzDto,
} from './dto/hausmeister.dto';

@Injectable()
export class HausmeisterService {
  private readonly logger = new Logger(HausmeisterService.name);

  constructor(private readonly prisma: PrismaService) {}

  async alleEinsaetzeLaden(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.hausmeisterEinsaetze.findMany({
        orderBy: { datum: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.hausmeisterEinsaetze.count(),
    ]);
    return {
      data: rows.map((e) => this.mapEinsatz(e)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async einsaetzeFuerMitarbeiterLaden(mitarbeiterId: number) {
    const rows = await this.prisma.hausmeisterEinsaetze.findMany({
      where: { mitarbeiter_id: BigInt(mitarbeiterId) },
      orderBy: { datum: 'desc' },
    });
    return rows.map((e) => this.mapEinsatz(e));
  }

  async einsatzErstellen(d: CreateHausmeisterEinsatzDto) {
    const taetigkeiten: Prisma.JsonArray = (d.taetigkeiten ?? []).map((entry) => entry);
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
    const taetigkeiten: Prisma.JsonArray = (d.taetigkeiten ?? []).map((entry) => entry);
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
