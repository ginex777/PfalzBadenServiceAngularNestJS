import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaService } from '../../core/database/prisma.service';
import { Prisma } from '@prisma/client';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import type { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import type { TasksService } from '../tasks/tasks.service';
import type { AccessPolicyService } from '../access-policy/access-policy.service';
import type { AccessPolicyAuth } from '../access-policy/access-policy.service';
import type {
  CreateMitarbeiterDto,
  CreateMitarbeiterStundenDto,
  StempelStartDto,
  UpdateMitarbeiterDto,
  UpdateMitarbeiterStundenDto,
} from './dto/mitarbeiter.dto';

@Injectable()
export class MitarbeiterService {
  private readonly logger = new Logger(MitarbeiterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly accessPolicy: AccessPolicyService,
  ) {}

  async alleMitarbeiterLaden(
    pagination: PaginationDto,
    filter?: { q?: string; aktiv?: string },
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const query = filter?.q?.trim();
    const aktiv =
      filter?.aktiv === '1' || filter?.aktiv?.toLowerCase() === 'true'
        ? true
        : filter?.aktiv === '0' || filter?.aktiv?.toLowerCase() === 'false'
          ? false
          : undefined;

    const where =
      query || aktiv !== undefined
        ? {
            AND: [
              aktiv !== undefined ? { aktiv } : {},
              query
                ? {
                    OR: [
                      {
                        name: { contains: query, mode: 'insensitive' as const },
                      },
                      {
                        email: {
                          contains: query,
                          mode: 'insensitive' as const,
                        },
                      },
                      {
                        rolle: {
                          contains: query,
                          mode: 'insensitive' as const,
                        },
                      },
                      {
                        tel: { contains: query, mode: 'insensitive' as const },
                      },
                    ],
                  }
                : {},
            ],
          }
        : undefined;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.mitarbeiter.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.mitarbeiter.count({ where }),
    ]);
    return {
      data: rows.map((m) => ({
        ...m,
        id: Number(m.id),
        stundenlohn: Number(m.stundenlohn),
      })),
      total,
      page,
      pageSize,
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
      take: 2000,
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

  async stundenErstellen(
    mitarbeiterId: number,
    d: CreateMitarbeiterStundenDto,
  ) {
    const mitarbeiter = await this.prisma.mitarbeiter.findUnique({
      where: { id: BigInt(mitarbeiterId) },
    });
    if (!mitarbeiter) throw new NotFoundException();
    const wage = this.calculateWage(
      d.stunden,
      d.lohn_satz ?? Number(mitarbeiter.stundenlohn),
      d.zuschlag_typ,
    );

    const s = await this.prisma.mitarbeiterStunden.create({
      data: {
        mitarbeiter: { connect: { id: BigInt(mitarbeiterId) } },
        datum: new Date(d.datum),
        stunden: new Prisma.Decimal(d.stunden),
        beschreibung: d.beschreibung ?? null,
        ort: d.ort ?? null,
        lohn: new Prisma.Decimal(wage.baseWage),
        zuschlag: new Prisma.Decimal(wage.surcharge),
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
    const existing = await this.prisma.mitarbeiterStunden.findUnique({
      where: { id: BigInt(stundenId) },
    });
    if (!existing) throw new NotFoundException();

    const data: Prisma.MitarbeiterStundenUpdateInput = {};
    if (d.datum !== undefined) data.datum = new Date(d.datum);
    if (d.stunden !== undefined) data.stunden = new Prisma.Decimal(d.stunden);
    if (d.beschreibung !== undefined)
      data.beschreibung = d.beschreibung ?? null;
    if (d.ort !== undefined) data.ort = d.ort ?? null;
    if (d.zuschlag_typ !== undefined) data.zuschlag_typ = d.zuschlag_typ ?? '';
    if (d.bezahlt !== undefined) data.bezahlt = d.bezahlt;

    if (
      d.stunden !== undefined ||
      d.lohn_satz !== undefined ||
      d.zuschlag_typ !== undefined
    ) {
      const mitarbeiter = await this.prisma.mitarbeiter.findUnique({
        where: { id: existing.mitarbeiter_id },
      });
      if (!mitarbeiter) throw new NotFoundException();
      const wage = this.calculateWage(
        d.stunden ?? Number(existing.stunden),
        d.lohn_satz ?? Number(mitarbeiter.stundenlohn),
        d.zuschlag_typ ?? existing.zuschlag_typ ?? '',
      );
      data.lohn = new Prisma.Decimal(wage.baseWage);
      data.zuschlag = new Prisma.Decimal(wage.surcharge);
    }

    const s = await this.prisma.mitarbeiterStunden.update({
      where: { id: BigInt(stundenId) },
      data,
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

  async stempelStart(
    mitarbeiterId: number,
    d: StempelStartDto,
    auth: AccessPolicyAuth,
  ) {
    await this.accessPolicy.assertCanAccessEmployee(auth, mitarbeiterId);
    const objektId = d.objektId ?? null;
    if (objektId == null) {
      throw new BadRequestException({
        code: 'MISSING_OBJECT',
        message: 'Objekt ist erforderlich. Bitte ein Objekt auswaehlen.',
      });
    }

    const objektExists = await this.prisma.objekte.findUnique({
      where: { id: BigInt(objektId) },
      select: { id: true },
    });
    if (!objektExists) {
      throw new BadRequestException({
        code: 'INVALID_OBJECT',
        message:
          'Objekt existiert nicht. Bitte ein gueltiges Objekt auswaehlen.',
      });
    }
    await this.accessPolicy.assertCanAccessObject(auth, objektId);

    // Close any open stempel first (safety)
    await this.prisma.stempel.updateMany({
      where: { mitarbeiter_id: BigInt(mitarbeiterId), stop: null },
      data: { stop: new Date(), dauer_minuten: 0 },
    });
    const s = await this.prisma.stempel.create({
      data: {
        mitarbeiter: { connect: { id: BigInt(mitarbeiterId) } },
        objekte: { connect: { id: BigInt(objektId) } },
        start: new Date(),
        notiz: d.notiz ?? null,
      },
    });
    return {
      id: Number(s.id),
      mitarbeiter_id: Number(s.mitarbeiter_id),
      objekt_id: s.objekt_id ? Number(s.objekt_id) : null,
      start: s.start,
    };
  }

  async stempelStop(mitarbeiterId: number, auth: AccessPolicyAuth) {
    await this.accessPolicy.assertCanAccessEmployee(auth, mitarbeiterId);
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

    await this.tasksService.upsertFromTimeEntry(Number(s.id));

    return {
      id: Number(s.id),
      mitarbeiter_id: Number(s.mitarbeiter_id),
      objekt_id: s.objekt_id ? Number(s.objekt_id) : null,
      start: s.start,
      stop: s.stop,
      dauer_minuten: s.dauer_minuten,
    };
  }

  async aktiverStempel(mitarbeiterId: number, auth: AccessPolicyAuth) {
    await this.accessPolicy.assertCanAccessEmployee(auth, mitarbeiterId);
    const stamp = await this.prisma.stempel.findFirst({
      where: { mitarbeiter_id: BigInt(mitarbeiterId), stop: null },
      orderBy: { start: 'desc' },
    });
    if (!stamp) return null;
    return {
      id: Number(stamp.id),
      mitarbeiter_id: Number(stamp.mitarbeiter_id),
      objekt_id: stamp.objekt_id ? Number(stamp.objekt_id) : null,
      start: stamp.start,
      stop: null,
      dauer_minuten: null,
      notiz: stamp.notiz,
    };
  }

  async zeiterfassungLaden(mitarbeiterId: number, auth: AccessPolicyAuth) {
    await this.accessPolicy.assertCanAccessEmployee(auth, mitarbeiterId);
    const rows = await this.prisma.stempel.findMany({
      where: { mitarbeiter_id: BigInt(mitarbeiterId) },
      orderBy: { start: 'desc' },
      take: 100,
    });
    return rows.map((s) => ({
      id: Number(s.id),
      mitarbeiter_id: Number(s.mitarbeiter_id),
      objekt_id: s.objekt_id ? Number(s.objekt_id) : null,
      start: s.start,
      stop: s.stop,
      dauer_minuten: s.dauer_minuten,
      notiz: s.notiz,
    }));
  }

  private calculateWage(
    hours: number,
    hourlyRate: number,
    surchargeType: string | null | undefined,
  ): { baseWage: number; surcharge: number } {
    const baseWage = this.roundCurrency(hours * hourlyRate);
    const surchargePercent = this.parseSurchargePercent(surchargeType);
    return {
      baseWage,
      surcharge: this.roundCurrency(baseWage * (surchargePercent / 100)),
    };
  }

  private parseSurchargePercent(
    surchargeType: string | null | undefined,
  ): number {
    const match = surchargeType?.trim().match(/^(\d+(?:\.\d+)?)%$/);
    return match ? Number(match[1]) : 0;
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
