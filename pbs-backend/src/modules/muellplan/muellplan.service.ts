import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Prisma, Objekte, MuellplanVorlagen } from '@prisma/client';
import {
  CreateMuellplanTerminDto,
  CreateMuellplanVorlageDto,
  CreateObjektDto,
  MuellplanVorlagenTerminDto,
  UpdateMuellplanTerminDto,
  UpdateObjektDto,
} from './dto/muellplan.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@Injectable()
export class MuellplanService {
  private readonly logger = new Logger(MuellplanService.name);

  constructor(private readonly prisma: PrismaService) {}

  async objekteLaden(
    pagination: PaginationDto,
    q?: string,
  ): Promise<PaginatedResponse<ReturnType<MuellplanService['mapObjekt']>>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const where =
      q && q.trim()
        ? {
            OR: [
              { name: { contains: q.trim(), mode: 'insensitive' as const } },
              { ort: { contains: q.trim(), mode: 'insensitive' as const } },
              { strasse: { contains: q.trim(), mode: 'insensitive' as const } },
            ],
          }
        : undefined;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.objekte.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.objekte.count({ where }),
    ]);
    return {
      data: rows.map((r) => this.mapObjekt(r)),
      total,
      page,
      pageSize,
    };
  }

  async objekteAlleLaden() {
    const rows = await this.prisma.objekte.findMany({
      orderBy: { name: 'asc' },
      take: 5000,
    });
    return rows.map((r) => this.mapObjekt(r));
  }

  async objektErstellen(d: CreateObjektDto) {
    const r = await this.prisma.objekte.create({
      data: {
        name: d.name,
        strasse: d.strasse ?? null,
        plz: d.plz ?? null,
        ort: d.ort ?? null,
        notiz: d.notiz ?? null,
        filter_typen: d.filter_typen ?? '',
        vorlage_id: d.vorlage_id ? BigInt(d.vorlage_id) : null,
        kunden: d.kunden_id
          ? { connect: { id: BigInt(d.kunden_id) } }
          : undefined,
      },
    });
    return {
      ...r,
      id: Number(r.id),
      kunden_id: r.kunden_id ? Number(r.kunden_id) : null,
      vorlage_id: r.vorlage_id ? Number(r.vorlage_id) : null,
    };
  }

  async objektAktualisieren(id: number, d: UpdateObjektDto) {
    if (!(await this.prisma.objekte.findUnique({ where: { id: BigInt(id) } })))
      throw new NotFoundException();
    const r = await this.prisma.objekte.update({
      where: { id: BigInt(id) },
      data: {
        name: d.name,
        strasse: d.strasse ?? null,
        plz: d.plz ?? null,
        ort: d.ort ?? null,
        notiz: d.notiz ?? null,
        filter_typen: d.filter_typen ?? '',
        vorlage_id: d.vorlage_id ? BigInt(d.vorlage_id) : null,
        kunden: d.kunden_id
          ? { connect: { id: BigInt(d.kunden_id) } }
          : { disconnect: true },
      },
    });
    return {
      ...r,
      id: Number(r.id),
      kunden_id: r.kunden_id ? Number(r.kunden_id) : null,
      vorlage_id: r.vorlage_id ? Number(r.vorlage_id) : null,
    };
  }

  async objektLoeschen(id: number) {
    if (!(await this.prisma.objekte.findUnique({ where: { id: BigInt(id) } })))
      throw new NotFoundException();
    await this.prisma.muellplan.deleteMany({
      where: { objekt_id: BigInt(id) },
    });
    await this.prisma.muellplanPdf.deleteMany({
      where: { objekt_id: BigInt(id) },
    });
    await this.prisma.objekte.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }

  async termineLaden(objektId: number) {
    const rows = await this.prisma.muellplan.findMany({
      where: { objekt_id: BigInt(objektId) },
      orderBy: { abholung: 'asc' },
      take: 5000,
    });
    return rows.map((r) => ({
      ...r,
      id: Number(r.id),
      objekt_id: Number(r.objekt_id),
      abholung: r.abholung.toISOString().slice(0, 10),
    }));
  }

  async anstehendeTermineLaden(limit = 5) {
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    const rows = await this.prisma.muellplan.findMany({
      where: { abholung: { gte: heute }, erledigt: false },
      orderBy: { abholung: 'asc' },
      take: limit,
      include: { objekte: { select: { name: true } } },
    });
    return rows.map((r) => ({
      ...r,
      id: Number(r.id),
      objekt_id: Number(r.objekt_id),
      abholung: r.abholung.toISOString().slice(0, 10),
      objekt_name: r.objekte.name,
      objekte: undefined,
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
      },
    });
    return {
      ...r,
      id: Number(r.id),
      objekt_id: Number(r.objekt_id),
      abholung: r.abholung.toISOString().slice(0, 10),
    };
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
      },
    });
    return {
      ...r,
      id: Number(r.id),
      objekt_id: Number(r.objekt_id),
      abholung: r.abholung.toISOString().slice(0, 10),
    };
  }

  async terminLoeschen(id: number) {
    if (
      !(await this.prisma.muellplan.findUnique({ where: { id: BigInt(id) } }))
    )
      throw new NotFoundException();
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
    const select = { id: true, name: true, pdf_name: true, created_at: true } as const;
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
        pdf_data: buffer as unknown as Uint8Array<ArrayBuffer>,
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
        pdf_data: buffer as unknown as Uint8Array<ArrayBuffer>,
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
  ) {
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

  async muellplanPdfMetadatenLaden(objektId: number) {
    const r = await this.prisma.muellplanPdf.findFirst({
      where: { objekt_id: BigInt(objektId) },
      select: { id: true, filename: true, verified: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });
    return r ? { ...r, id: Number(r.id) } : null;
  }

  private mapObjekt(r: Objekte) {
    return {
      ...r,
      id: Number(r.id),
      kunden_id: r.kunden_id ? Number(r.kunden_id) : null,
      vorlage_id: r.vorlage_id ? Number(r.vorlage_id) : null,
    };
  }

  private mapVorlageListItem(
    r: Pick<MuellplanVorlagen, 'id' | 'name' | 'pdf_name' | 'created_at'>,
  ) {
    return { ...r, id: Number(r.id) };
  }
}
