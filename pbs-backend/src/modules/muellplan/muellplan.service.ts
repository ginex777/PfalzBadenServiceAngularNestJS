import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import type { Prisma, MuellplanVorlagen } from '@prisma/client';
import type {
  CreateMuellplanTerminDto,
  CreateMuellplanVorlageDto,
  ErledigunDto,
  MuellplanVorlagenTerminDto,
  UpdateMuellplanTerminDto,
} from './dto/muellplan.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import type { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { TasksService } from '../tasks/tasks.service';
import { AccessPolicyService } from '../access-policy/access-policy.service';
import type { AccessPolicyAuth } from '../access-policy/access-policy.service';
import { toPrismaBytes } from '../../common/files/upload-file';

@Injectable()
export class MuellplanService {
  private readonly logger = new Logger(MuellplanService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly accessPolicy: AccessPolicyService,
  ) {}

  async termineLaden(objektId: number, auth: AccessPolicyAuth) {
    await this.accessPolicy.assertCanAccessObject(auth, objektId);
    const rows = await this.prisma.muellplan.findMany({
      where: { objekt_id: BigInt(objektId) },
      orderBy: { abholung: 'asc' },
      take: 5000,
      include: {
        user: {
          select: { id: true, email: true, vorname: true, nachname: true },
        },
      },
    });
    return rows.map((r) => this.mapTermin(r));
  }

  async anstehendeTermineLaden(limit = 5, auth: AccessPolicyAuth) {
    const heute = this.startOfToday();
    const accessibleObjectIds =
      await this.accessPolicy.accessibleObjectIds(auth);
    const rows = await this.prisma.muellplan.findMany({
      where: {
        abholung: { gte: heute },
        erledigt: false,
        aktiv: true,
        ...(accessibleObjectIds
          ? { objekt_id: { in: accessibleObjectIds } }
          : {}),
      },
      orderBy: { abholung: 'asc' },
      take: limit,
      include: {
        objekte: { select: { name: true } },
        user: {
          select: { id: true, email: true, vorname: true, nachname: true },
        },
      },
    });
    return rows.map((r) => ({
      ...this.mapTermin(r),
      objekt_name: r.objekte.name,
    }));
  }

  async terminErstellen(d: CreateMuellplanTerminDto) {
    const r = await this.prisma.muellplan.create({
      data: {
        objekte: { connect: { id: BigInt(d.objekt_id) } },
        muellart: d.muellart,
        farbe: d.farbe ?? '#6366f1',
        abholung: new Date(d.abholung),
        erledigt: d.erledigt ?? false,
        beschreibung: d.beschreibung ?? null,
        aktiv: d.aktiv ?? true,
        ...(d.user_id ? { user: { connect: { id: BigInt(d.user_id) } } } : {}),
      },
      include: {
        user: {
          select: { id: true, email: true, vorname: true, nachname: true },
        },
      },
    });

    await this.tasksService.upsertFromMuellplan(Number(r.id));

    return this.mapTermin(r);
  }

  async terminAktualisieren(id: number, d: UpdateMuellplanTerminDto) {
    if (
      !(await this.prisma.muellplan.findUnique({ where: { id: BigInt(id) } }))
    )
      throw new NotFoundException();
    const r = await this.prisma.muellplan.update({
      where: { id: BigInt(id) },
      data: {
        muellart: d.muellart,
        farbe: d.farbe ?? '#6366f1',
        abholung: new Date(d.abholung),
        erledigt: d.erledigt ?? false,
        beschreibung: d.beschreibung !== undefined ? d.beschreibung : undefined,
        aktiv: d.aktiv !== undefined ? d.aktiv : undefined,
        user_id:
          d.user_id !== undefined
            ? d.user_id
              ? BigInt(d.user_id)
              : null
            : undefined,
      },
      include: {
        user: {
          select: { id: true, email: true, vorname: true, nachname: true },
        },
      },
    });

    await this.tasksService.upsertFromMuellplan(id);

    return this.mapTermin(r);
  }

  async terminErledigen(id: number, d: ErledigunDto, auth: AccessPolicyAuth) {
    const row = await this.prisma.muellplan.findUnique({
      where: { id: BigInt(id) },
    });
    if (!row) throw new NotFoundException();
    await this.accessPolicy.assertCanAccessObject(auth, Number(row.objekt_id));
    const r = await this.prisma.muellplan.update({
      where: { id: BigInt(id) },
      data: { erledigt: true },
      include: {
        user: {
          select: { id: true, email: true, vorname: true, nachname: true },
        },
      },
    });
    await this.tasksService.upsertFromMuellplan(id, {
      kommentar: d.kommentar,
      fotoUrl: d.foto_url,
    });
    return this.mapTermin(r);
  }

  async terminLoeschen(id: number) {
    if (
      !(await this.prisma.muellplan.findUnique({ where: { id: BigInt(id) } }))
    )
      throw new NotFoundException();

    await this.tasksService.deleteByMuellplanId(id);
    await this.prisma.muellplan.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }

  async termineKopieren(fromObjektId: number, toObjektId: number) {
    const source = await this.prisma.muellplan.findMany({
      where: { objekt_id: BigInt(fromObjektId) },
      take: 5000,
    });
    const existing = await this.prisma.muellplan.findMany({
      where: { objekt_id: BigInt(toObjektId) },
      take: 5000,
    });
    const existingSet = new Set(
      existing.map(
        (e) => `${e.abholung.toISOString().slice(0, 10)}|${e.muellart}`,
      ),
    );
    let added = 0;
    for (const t of source) {
      const key = `${t.abholung.toISOString().slice(0, 10)}|${t.muellart}`;
      if (!existingSet.has(key)) {
        await this.prisma.muellplan.create({
          data: {
            objekte: { connect: { id: BigInt(toObjektId) } },
            muellart: t.muellart,
            farbe: t.farbe,
            abholung: t.abholung,
            erledigt: false,
          },
        });
        added++;
      }
    }
    return { ok: true, added };
  }

  async vorlagenLaden(
    pagination: PaginationDto,
    q?: string,
  ): Promise<
    PaginatedResponse<ReturnType<MuellplanService['mapVorlageListItem']>>
  > {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const where =
      q && q.trim()
        ? { name: { contains: q.trim(), mode: 'insensitive' as const } }
        : undefined;
    const select = {
      id: true,
      name: true,
      pdf_name: true,
      created_at: true,
    } as const;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.muellplanVorlagen.findMany({
        where,
        select,
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.muellplanVorlagen.count({ where }),
    ]);
    return {
      data: rows.map((r) => this.mapVorlageListItem(r)),
      total,
      page,
      pageSize,
    };
  }

  async vorlagenAlleLaden() {
    const rows = await this.prisma.muellplanVorlagen.findMany({
      select: { id: true, name: true, pdf_name: true, created_at: true },
      orderBy: { name: 'asc' },
      take: 5000,
    });
    return rows.map((r) => this.mapVorlageListItem(r));
  }

  async vorlageLaden(id: number) {
    const v = await this.prisma.muellplanVorlagen.findUnique({
      where: { id: BigInt(id) },
    });
    if (!v) throw new NotFoundException();
    return { ...v, id: Number(v.id), pdf_data: undefined };
  }

  async vorlageErstellen(d: CreateMuellplanVorlageDto) {
    const termine: Prisma.JsonArray = (d.termine ?? []).map((termin) => ({
      muellart: termin.muellart,
      farbe: termin.farbe ?? '#6366f1',
      abholung: termin.abholung,
    }));
    const v = await this.prisma.muellplanVorlagen.create({
      data: {
        name: d.name,
        termine,
      },
    });
    return { id: Number(v.id), name: v.name, created_at: v.created_at };
  }

  async vorlageLoeschen(id: number) {
    if (
      !(await this.prisma.muellplanVorlagen.findUnique({
        where: { id: BigInt(id) },
      }))
    )
      throw new NotFoundException();
    await this.prisma.muellplanVorlagen.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }

  async vorlagePdfSpeichern(id: number, buffer: Buffer, filename: string) {
    await this.prisma.muellplanVorlagen.update({
      where: { id: BigInt(id) },
      data: {
        pdf_data: toPrismaBytes(buffer),
        pdf_name: filename,
      },
    });
    return { ok: true, pdf_name: filename };
  }

  async vorlagePdfLaden(id: number) {
    const v = await this.prisma.muellplanVorlagen.findUnique({
      where: { id: BigInt(id) },
      select: { pdf_data: true, pdf_name: true },
    });
    if (!v || !v.pdf_data) throw new NotFoundException('Kein PDF vorhanden');
    return v;
  }

  async muellplanPdfSpeichern(
    objektId: number,
    buffer: Buffer,
    filename: string,
  ) {
    await this.prisma.muellplanPdf.deleteMany({
      where: { objekt_id: BigInt(objektId) },
    });
    const r = await this.prisma.muellplanPdf.create({
      data: {
        objekte: { connect: { id: BigInt(objektId) } },
        filename,
        pdf_data: toPrismaBytes(buffer),
        verified: false,
      },
    });
    return {
      id: Number(r.id),
      filename: r.filename,
      verified: r.verified,
      created_at: r.created_at,
    };
  }

  async muellplanPdfBestaetigen(
    objektId: number,
    termine: MuellplanVorlagenTerminDto[],
    auth: AccessPolicyAuth,
  ) {
    await this.accessPolicy.assertCanAccessObject(auth, objektId);
    const objectRow = await this.prisma.objekte.findUnique({
      where: { id: BigInt(objektId) },
      select: { id: true, name: true },
    });
    if (!objectRow) throw new NotFoundException('Objekt nicht gefunden');

    await this.prisma.muellplanPdf.updateMany({
      where: { objekt_id: BigInt(objektId) },
      data: { verified: true },
    });
    const existing = await this.prisma.muellplan.findMany({
      where: { objekt_id: BigInt(objektId) },
      take: 5000,
    });
    const existingSet = new Set(
      existing.map(
        (e) => `${e.abholung.toISOString().slice(0, 10)}|${e.muellart}`,
      ),
    );
    let added = 0;
    for (const t of termine) {
      if (!existingSet.has(`${t.abholung}|${t.muellart}`)) {
        await this.prisma.muellplan.create({
          data: {
            objekte: { connect: { id: BigInt(objektId) } },
            muellart: t.muellart,
            farbe: t.farbe || '#6366f1',
            abholung: new Date(t.abholung),
            erledigt: false,
          },
        });
        added++;
      }
    }

    await this.prisma.benachrichtigungen.create({
      data: {
        typ: 'MOBILE_WASTEPLAN_CONFIRM',
        titel: `MÃ¼llplan bestÃ¤tigt: ${objectRow.name}`,
        nachricht: added > 0 ? `${added} Termine Ã¼bernommen.` : undefined,
        link: `/muellplan`,
        gelesen: false,
      },
    });
    return { ok: true, added };
  }

  async muellplanPdfMetadatenLaden(objektId: number, auth: AccessPolicyAuth) {
    await this.accessPolicy.assertCanAccessObject(auth, objektId);
    const r = await this.prisma.muellplanPdf.findFirst({
      where: { objekt_id: BigInt(objektId) },
      select: { id: true, filename: true, verified: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });
    return r ? { ...r, id: Number(r.id) } : null;
  }

  private mapVorlageListItem(
    r: Pick<MuellplanVorlagen, 'id' | 'name' | 'pdf_name' | 'created_at'>,
  ) {
    return { ...r, id: Number(r.id) };
  }

  private mapTermin(r: {
    id: bigint;
    objekt_id: bigint;
    muellart: string;
    farbe: string;
    abholung: Date;
    erledigt: boolean;
    beschreibung?: string | null;
    aktiv?: boolean;
    user_id?: bigint | null;
    created_at?: Date | null;
    user?: {
      id: bigint;
      email: string;
      vorname: string | null;
      nachname: string | null;
    } | null;
  }) {
    const pickupDate = this.dateOnly(r.abholung);
    const today = this.startOfToday();
    return {
      id: Number(r.id),
      objekt_id: Number(r.objekt_id),
      muellart: r.muellart,
      farbe: r.farbe,
      abholung: r.abholung.toISOString().slice(0, 10),
      erledigt: r.erledigt,
      isToday: pickupDate.getTime() === today.getTime(),
      isDue: pickupDate.getTime() <= today.getTime(),
      beschreibung: r.beschreibung ?? null,
      aktiv: r.aktiv ?? true,
      user_id: r.user_id ? Number(r.user_id) : null,
      user: r.user
        ? {
            id: Number(r.user.id),
            email: r.user.email,
            vorname: r.user.vorname,
            nachname: r.user.nachname,
          }
        : null,
    };
  }

  private startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private dateOnly(value: Date): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
