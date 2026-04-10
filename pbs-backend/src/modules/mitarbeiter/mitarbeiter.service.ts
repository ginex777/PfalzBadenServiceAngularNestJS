import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MitarbeiterService {
  constructor(private readonly prisma: PrismaService) {}

  async alleMitarbeiterLaden() {
    const rows = await this.prisma.mitarbeiter.findMany({ orderBy: { name: 'asc' } });
    return rows.map(m => ({ ...m, id: Number(m.id), stundenlohn: Number(m.stundenlohn) }));
  }

  async mitarbeiterErstellen(d: Record<string, unknown>) {
    const m = await this.prisma.mitarbeiter.create({
      data: {
        name: String(d['name'] ?? ''),
        rolle: d['rolle'] ? String(d['rolle']) : null,
        stundenlohn: new Prisma.Decimal(Number(d['stundenlohn'] ?? 0)),
        email: d['email'] ? String(d['email']) : null,
        tel: d['tel'] ? String(d['tel']) : null,
        notiz: d['notiz'] ? String(d['notiz']) : null,
        aktiv: d['aktiv'] !== false,
      },
    });
    return { ...m, id: Number(m.id), stundenlohn: Number(m.stundenlohn) };
  }

  async mitarbeiterAktualisieren(id: number, d: Record<string, unknown>) {
    if (!await this.prisma.mitarbeiter.findUnique({ where: { id: BigInt(id) } })) throw new NotFoundException();
    const m = await this.prisma.mitarbeiter.update({
      where: { id: BigInt(id) },
      data: {
        name: String(d['name'] ?? ''),
        rolle: d['rolle'] ? String(d['rolle']) : null,
        stundenlohn: new Prisma.Decimal(Number(d['stundenlohn'] ?? 0)),
        email: d['email'] ? String(d['email']) : null,
        tel: d['tel'] ? String(d['tel']) : null,
        notiz: d['notiz'] ? String(d['notiz']) : null,
        aktiv: Boolean(d['aktiv']),
      },
    });
    return { ...m, id: Number(m.id), stundenlohn: Number(m.stundenlohn) };
  }

  async mitarbeiterLoeschen(id: number) {
    if (!await this.prisma.mitarbeiter.findUnique({ where: { id: BigInt(id) } })) throw new NotFoundException();
    await this.prisma.mitarbeiterStunden.deleteMany({ where: { mitarbeiter_id: BigInt(id) } });
    await this.prisma.mitarbeiter.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }

  async stundenLaden(mitarbeiterId: number) {
    const rows = await this.prisma.mitarbeiterStunden.findMany({
      where: { mitarbeiter_id: BigInt(mitarbeiterId) },
      orderBy: { datum: 'desc' },
    });
    return rows.map(s => ({ ...s, id: Number(s.id), mitarbeiter_id: Number(s.mitarbeiter_id), stunden: Number(s.stunden), lohn: Number(s.lohn), zuschlag: Number(s.zuschlag) }));
  }

  async stundenErstellen(mitarbeiterId: number, d: Record<string, unknown>) {
    const s = await this.prisma.mitarbeiterStunden.create({
      data: {
        mitarbeiter: { connect: { id: BigInt(mitarbeiterId) } },
        datum: new Date(String(d['datum'])),
        stunden: new Prisma.Decimal(Number(d['stunden'])),
        beschreibung: d['beschreibung'] ? String(d['beschreibung']) : null,
        ort: d['ort'] ? String(d['ort']) : null,
        lohn: new Prisma.Decimal(Number(d['lohn'] ?? 0)),
        zuschlag: new Prisma.Decimal(Number(d['zuschlag'] ?? 0)),
        zuschlag_typ: d['zuschlag_typ'] ? String(d['zuschlag_typ']) : '',
        bezahlt: Boolean(d['bezahlt']),
      },
    });
    return { ...s, id: Number(s.id), mitarbeiter_id: Number(s.mitarbeiter_id), stunden: Number(s.stunden), lohn: Number(s.lohn), zuschlag: Number(s.zuschlag) };
  }

  async stundenAktualisieren(stundenId: number, d: Record<string, unknown>) {
    if (!await this.prisma.mitarbeiterStunden.findUnique({ where: { id: BigInt(stundenId) } })) throw new NotFoundException();
    const s = await this.prisma.mitarbeiterStunden.update({
      where: { id: BigInt(stundenId) },
      data: {
        datum: new Date(String(d['datum'])),
        stunden: new Prisma.Decimal(Number(d['stunden'])),
        beschreibung: d['beschreibung'] ? String(d['beschreibung']) : null,
        ort: d['ort'] ? String(d['ort']) : null,
        lohn: new Prisma.Decimal(Number(d['lohn'] ?? 0)),
        zuschlag: new Prisma.Decimal(Number(d['zuschlag'] ?? 0)),
        zuschlag_typ: d['zuschlag_typ'] ? String(d['zuschlag_typ']) : '',
        bezahlt: Boolean(d['bezahlt']),
      },
    });
    return { ...s, id: Number(s.id), mitarbeiter_id: Number(s.mitarbeiter_id), stunden: Number(s.stunden), lohn: Number(s.lohn), zuschlag: Number(s.zuschlag) };
  }

  async stundenLoeschen(stundenId: number) {
    if (!await this.prisma.mitarbeiterStunden.findUnique({ where: { id: BigInt(stundenId) } })) throw new NotFoundException();
    await this.prisma.mitarbeiterStunden.delete({ where: { id: BigInt(stundenId) } });
    return { ok: true };
  }
}
