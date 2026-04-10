import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class HausmeisterService {
  constructor(private readonly prisma: PrismaService) {}

  async alleEinsaetzeLaden() {
    const rows = await this.prisma.hausmeisterEinsaetze.findMany({ orderBy: { datum: 'desc' } });
    return rows.map(e => this.mapEinsatz(e));
  }

  async einsaetzeFuerMitarbeiterLaden(mitarbeiterId: number) {
    const rows = await this.prisma.hausmeisterEinsaetze.findMany({
      where: { mitarbeiter_id: BigInt(mitarbeiterId) },
      orderBy: { datum: 'desc' },
    });
    return rows.map(e => this.mapEinsatz(e));
  }

  async einsatzErstellen(d: Record<string, unknown>) {
    const e = await this.prisma.hausmeisterEinsaetze.create({
      data: {
        mitarbeiter_id: d['mitarbeiter_id'] ? BigInt(Number(d['mitarbeiter_id'])) : null,
        mitarbeiter_name: String(d['mitarbeiter_name'] ?? ''),
        kunden_id: d['kunden_id'] ? BigInt(Number(d['kunden_id'])) : null,
        kunden_name: d['kunden_name'] ? String(d['kunden_name']) : null,
        datum: new Date(String(d['datum'])),
        taetigkeiten: (d['taetigkeiten'] as Prisma.InputJsonValue) ?? [],
        stunden_gesamt: new Prisma.Decimal(Number(d['stunden_gesamt'] ?? 0)),
        notiz: d['notiz'] ? String(d['notiz']) : null,
        abgeschlossen: Boolean(d['abgeschlossen']),
      },
    });
    return this.mapEinsatz(e);
  }

  async einsatzAktualisieren(id: number, d: Record<string, unknown>) {
    if (!await this.prisma.hausmeisterEinsaetze.findUnique({ where: { id: BigInt(id) } })) throw new NotFoundException();
    const e = await this.prisma.hausmeisterEinsaetze.update({
      where: { id: BigInt(id) },
      data: {
        mitarbeiter_id: d['mitarbeiter_id'] ? BigInt(Number(d['mitarbeiter_id'])) : null,
        mitarbeiter_name: String(d['mitarbeiter_name'] ?? ''),
        kunden_id: d['kunden_id'] ? BigInt(Number(d['kunden_id'])) : null,
        kunden_name: d['kunden_name'] ? String(d['kunden_name']) : null,
        datum: new Date(String(d['datum'])),
        taetigkeiten: (d['taetigkeiten'] as Prisma.InputJsonValue) ?? [],
        stunden_gesamt: new Prisma.Decimal(Number(d['stunden_gesamt'] ?? 0)),
        notiz: d['notiz'] ? String(d['notiz']) : null,
        abgeschlossen: Boolean(d['abgeschlossen']),
      },
    });
    return this.mapEinsatz(e);
  }

  async einsatzLoeschen(id: number) {
    if (!await this.prisma.hausmeisterEinsaetze.findUnique({ where: { id: BigInt(id) } })) throw new NotFoundException();
    await this.prisma.hausmeisterEinsaetze.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }

  private mapEinsatz(e: Record<string, unknown>) {
    return {
      ...e,
      id: Number(e['id']),
      mitarbeiter_id: e['mitarbeiter_id'] ? Number(e['mitarbeiter_id']) : null,
      kunden_id: e['kunden_id'] ? Number(e['kunden_id']) : null,
      stunden_gesamt: Number(e['stunden_gesamt']),
      datum: e['datum'] instanceof Date ? e['datum'].toISOString().slice(0, 10) : e['datum'],
    };
  }
}
