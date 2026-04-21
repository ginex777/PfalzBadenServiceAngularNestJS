import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class MuellplanService {
  private readonly logger = new Logger(MuellplanService.name);

  constructor(private readonly prisma: PrismaService) {}

  async objekteLaden() {
    const rows = await this.prisma.objekte.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => ({
      ...r,
      id: Number(r.id),
      kunden_id: r.kunden_id ? Number(r.kunden_id) : null,
      vorlage_id: r.vorlage_id ? Number(r.vorlage_id) : null,
    }));
  }

  async objektErstellen(d: Record<string, unknown>) {
    const r = await this.prisma.objekte.create({
      data: {
        name: String(d['name'] ?? ''),
        strasse: d['strasse'] ? String(d['strasse']) : null,
        plz: d['plz'] ? String(d['plz']) : null,
        ort: d['ort'] ? String(d['ort']) : null,
        notiz: d['notiz'] ? String(d['notiz']) : null,
        filter_typen: d['filter_typen'] ? String(d['filter_typen']) : '',
        vorlage_id: d['vorlage_id'] ? BigInt(Number(d['vorlage_id'])) : null,
        kunden: d['kunden_id']
          ? { connect: { id: BigInt(Number(d['kunden_id'])) } }
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

  async objektAktualisieren(id: number, d: Record<string, unknown>) {
    if (!(await this.prisma.objekte.findUnique({ where: { id: BigInt(id) } })))
      throw new NotFoundException();
    const r = await this.prisma.objekte.update({
      where: { id: BigInt(id) },
      data: {
        name: String(d['name'] ?? ''),
        strasse: d['strasse'] ? String(d['strasse']) : null,
        plz: d['plz'] ? String(d['plz']) : null,
        ort: d['ort'] ? String(d['ort']) : null,
        notiz: d['notiz'] ? String(d['notiz']) : null,
        filter_typen: d['filter_typen'] ? String(d['filter_typen']) : '',
        vorlage_id: d['vorlage_id'] ? BigInt(Number(d['vorlage_id'])) : null,
        kunden: d['kunden_id']
          ? { connect: { id: BigInt(Number(d['kunden_id'])) } }
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

  async terminErstellen(d: Record<string, unknown>) {
    const r = await this.prisma.muellplan.create({
      data: {
        objekte: { connect: { id: BigInt(Number(d['objekt_id'])) } },
        muellart: String(d['muellart'] ?? ''),
        farbe: d['farbe'] ? String(d['farbe']) : '#6366f1',
        abholung: new Date(String(d['abholung'])),
        erledigt: Boolean(d['erledigt']),
      },
    });
    return {
      ...r,
      id: Number(r.id),
      objekt_id: Number(r.objekt_id),
      abholung: r.abholung.toISOString().slice(0, 10),
    };
  }

  async terminAktualisieren(id: number, d: Record<string, unknown>) {
    if (
      !(await this.prisma.muellplan.findUnique({ where: { id: BigInt(id) } }))
    )
      throw new NotFoundException();
    const r = await this.prisma.muellplan.update({
      where: { id: BigInt(id) },
      data: {
        muellart: String(d['muellart'] ?? ''),
        farbe: d['farbe'] ? String(d['farbe']) : '#6366f1',
        abholung: new Date(String(d['abholung'])),
        erledigt: Boolean(d['erledigt']),
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
    });
    const existing = await this.prisma.muellplan.findMany({
      where: { objekt_id: BigInt(toObjektId) },
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

  async vorlagenLaden() {
    const rows = await this.prisma.muellplanVorlagen.findMany({
      select: { id: true, name: true, pdf_name: true, created_at: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => ({ ...r, id: Number(r.id) }));
  }

  async vorlageLaden(id: number) {
    const v = await this.prisma.muellplanVorlagen.findUnique({
      where: { id: BigInt(id) },
    });
    if (!v) throw new NotFoundException();
    return { ...v, id: Number(v.id), pdf_data: undefined };
  }

  async vorlageErstellen(d: Record<string, unknown>) {
    const v = await this.prisma.muellplanVorlagen.create({
      data: {
        name: String(d['name'] ?? ''),
        termine: (d['termine'] as object) ?? [],
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
    termine: { muellart: string; farbe: string; abholung: string }[],
  ) {
    await this.prisma.muellplanPdf.updateMany({
      where: { objekt_id: BigInt(objektId) },
      data: { verified: true },
    });
    const existing = await this.prisma.muellplan.findMany({
      where: { objekt_id: BigInt(objektId) },
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
}
