import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  CreateMitarbeiterDto,
  CreateMitarbeiterStundenDto,
  StempelStartDto,
  UpdateMitarbeiterDto,
  UpdateMitarbeiterStundenDto,
} from './dto/mitarbeiter.dto';

@Injectable()
export class MitarbeiterService {
  private readonly logger = new Logger(MitarbeiterService.name);

  constructor(private readonly prisma: PrismaService) {}

  async alleMitarbeiterLaden(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.mitarbeiter.findMany({
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.mitarbeiter.count(),
    ]);
    return {
      data: rows.map((m) => ({
        ...m,
        id: Number(m.id),
        stundenlohn: Number(m.stundenlohn),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async mitarbeiterErstellen(d: CreateMitarbeiterDto) {
    const m = await this.prisma.mitarbeiter.create({
      data: {
        name: d.name,
        rolle: d.rolle ?? null,
        stundenlohn: new Prisma.Decimal(d.stundenlohn),
        email: d.email ?? null,
        tel: d.tel ?? null,
        notiz: d.notiz ?? null,
        aktiv: d.aktiv !== false,
      },
    });
    return { ...m, id: Number(m.id), stundenlohn: Number(m.stundenlohn) };
  }

  async mitarbeiterAktualisieren(id: number, d: UpdateMitarbeiterDto) {
    if (
      !(await this.prisma.mitarbeiter.findUnique({ where: { id: BigInt(id) } }))
    )
      throw new NotFoundException();
    const m = await this.prisma.mitarbeiter.update({
      where: { id: BigInt(id) },
      data: {
        name: d.name,
        rolle: d.rolle ?? null,
        stundenlohn: new Prisma.Decimal(d.stundenlohn),
        email: d.email ?? null,
        tel: d.tel ?? null,
        notiz: d.notiz ?? null,
        aktiv: d.aktiv ?? false,
      },
    });
    return { ...m, id: Number(m.id), stundenlohn: Number(m.stundenlohn) };
  }

  async mitarbeiterLoeschen(id: number) {
    if (
      !(await this.prisma.mitarbeiter.findUnique({ where: { id: BigInt(id) } }))
    )
      throw new NotFoundException();
    await this.prisma.mitarbeiterStunden.deleteMany({
      where: { mitarbeiter_id: BigInt(id) },
    });
    await this.prisma.mitarbeiter.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }

  async stundenLaden(mitarbeiterId: number) {
    const rows = await this.prisma.mitarbeiterStunden.findMany({
      where: { mitarbeiter_id: BigInt(mitarbeiterId) },
      orderBy: { datum: 'desc' },
    });
    return rows.map((s) => ({
      ...s,
      id: Number(s.id),
      mitarbeiter_id: Number(s.mitarbeiter_id),
      stunden: Number(s.stunden),
      lohn: Number(s.lohn),
      zuschlag: Number(s.zuschlag),
    }));
  }

  async stundenErstellen(mitarbeiterId: number, d: CreateMitarbeiterStundenDto) {
    // FIXED: Auto-calculate wage if not provided
    let lohn = d.lohn ?? 0;
    const zuschlag = d.zuschlag ?? 0;

    if (lohn === 0) {
      // Auto-calculate from employee hourly rate
      const mitarbeiter = await this.prisma.mitarbeiter.findUnique({
        where: { id: BigInt(mitarbeiterId) },
      });
      if (mitarbeiter) {
        const stunden = d.stunden;
        lohn = Number(mitarbeiter.stundenlohn) * stunden;
      }
    }

    const s = await this.prisma.mitarbeiterStunden.create({
      data: {
        mitarbeiter: { connect: { id: BigInt(mitarbeiterId) } },
        datum: new Date(d.datum),
        stunden: new Prisma.Decimal(d.stunden),
        beschreibung: d.beschreibung ?? null,
        ort: d.ort ?? null,
        lohn: new Prisma.Decimal(lohn),
        zuschlag: new Prisma.Decimal(zuschlag),
        zuschlag_typ: d.zuschlag_typ ?? '',
        bezahlt: d.bezahlt ?? false,
      },
    });
    return {
      ...s,
      id: Number(s.id),
      mitarbeiter_id: Number(s.mitarbeiter_id),
      stunden: Number(s.stunden),
      lohn: Number(s.lohn),
      zuschlag: Number(s.zuschlag),
    };
  }

  async stundenAktualisieren(
    stundenId: number,
    d: UpdateMitarbeiterStundenDto,
  ) {
    if (
      !(await this.prisma.mitarbeiterStunden.findUnique({
        where: { id: BigInt(stundenId) },
      }))
    )
      throw new NotFoundException();
    const s = await this.prisma.mitarbeiterStunden.update({
      where: { id: BigInt(stundenId) },
      data: {
        datum: new Date(d.datum),
        stunden: new Prisma.Decimal(d.stunden),
        beschreibung: d.beschreibung ?? null,
        ort: d.ort ?? null,
        lohn: new Prisma.Decimal(d.lohn ?? 0),
        zuschlag: new Prisma.Decimal(d.zuschlag ?? 0),
        zuschlag_typ: d.zuschlag_typ ?? '',
        bezahlt: d.bezahlt ?? false,
      },
    });
    return {
      ...s,
      id: Number(s.id),
      mitarbeiter_id: Number(s.mitarbeiter_id),
      stunden: Number(s.stunden),
      lohn: Number(s.lohn),
      zuschlag: Number(s.zuschlag),
    };
  }

  async stundenLoeschen(stundenId: number) {
    if (
      !(await this.prisma.mitarbeiterStunden.findUnique({
        where: { id: BigInt(stundenId) },
      }))
    )
      throw new NotFoundException();
    await this.prisma.mitarbeiterStunden.delete({
      where: { id: BigInt(stundenId) },
    });
    return { ok: true };
  }

  // ── Mobile Stempeluhr ─────────────────────────────────────────────────────

  async stempelStart(mitarbeiterId: number, d: StempelStartDto) {
    // Close any open stempel first (safety)
    await this.prisma.stempel.updateMany({
      where: { mitarbeiter_id: BigInt(mitarbeiterId), stop: null },
      data: { stop: new Date(), dauer_minuten: 0 },
    });
    const s = await this.prisma.stempel.create({
      data: {
        mitarbeiter: { connect: { id: BigInt(mitarbeiterId) } },
        start: new Date(),
        notiz: d.notiz ?? null,
      },
    });
    return {
      id: Number(s.id),
      mitarbeiter_id: Number(s.mitarbeiter_id),
      start: s.start,
    };
  }

  async stempelStop(mitarbeiterId: number) {
    const open = await this.prisma.stempel.findFirst({
      where: { mitarbeiter_id: BigInt(mitarbeiterId), stop: null },
      orderBy: { start: 'desc' },
    });
    if (!open) throw new NotFoundException('Kein offener Stempel gefunden');
    const stop = new Date();
    const dauerMs = stop.getTime() - open.start.getTime();
    const dauerMinuten = Math.round(dauerMs / 60000);
    const s = await this.prisma.stempel.update({
      where: { id: open.id },
      data: { stop, dauer_minuten: dauerMinuten },
    });
    return {
      id: Number(s.id),
      mitarbeiter_id: Number(s.mitarbeiter_id),
      start: s.start,
      stop: s.stop,
      dauer_minuten: s.dauer_minuten,
    };
  }

  async zeiterfassungLaden(mitarbeiterId: number) {
    const rows = await this.prisma.stempel.findMany({
      where: { mitarbeiter_id: BigInt(mitarbeiterId) },
      orderBy: { start: 'desc' },
      take: 100,
    });
    return rows.map((s) => ({
      id: Number(s.id),
      mitarbeiter_id: Number(s.mitarbeiter_id),
      start: s.start,
      stop: s.stop,
      dauer_minuten: s.dauer_minuten,
      notiz: s.notiz,
    }));
  }
}
