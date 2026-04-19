import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WiederkehrendService {
  private readonly logger = new Logger(WiederkehrendService.name);

  constructor(private readonly prisma: PrismaService) {}

  async ausgabenLaden() {
    const rows = await this.prisma.wiederkehrendeAusgaben.findMany({ orderBy: { name: 'asc' } });
    return rows.map(a => ({ ...a, id: Number(a.id), brutto: Number(a.brutto), mwst: Number(a.mwst), abzug: Number(a.abzug) }));
  }

  async ausgabeErstellen(d: Record<string, unknown>) {
    const a = await this.prisma.wiederkehrendeAusgaben.create({
      data: {
        name: String(d['name'] ?? ''),
        kategorie: d['kategorie'] ? String(d['kategorie']) : 'Betriebsausgabe',
        brutto: new Prisma.Decimal(Number(d['brutto'] ?? 0)),
        mwst: new Prisma.Decimal(Number(d['mwst'] ?? 19)),
        abzug: new Prisma.Decimal(Number(d['abzug'] ?? 100)),
        belegnr: d['belegnr'] ? String(d['belegnr']) : null,
        aktiv: d['aktiv'] !== false,
      },
    });
    return { ...a, id: Number(a.id), brutto: Number(a.brutto), mwst: Number(a.mwst), abzug: Number(a.abzug) };
  }

  async ausgabeAktualisieren(id: number, d: Record<string, unknown>) {
    if (!await this.prisma.wiederkehrendeAusgaben.findUnique({ where: { id: BigInt(id) } })) throw new NotFoundException();
    const a = await this.prisma.wiederkehrendeAusgaben.update({
      where: { id: BigInt(id) },
      data: {
        name: String(d['name'] ?? ''),
        kategorie: d['kategorie'] ? String(d['kategorie']) : 'Betriebsausgabe',
        brutto: new Prisma.Decimal(Number(d['brutto'] ?? 0)),
        mwst: new Prisma.Decimal(Number(d['mwst'] ?? 19)),
        abzug: new Prisma.Decimal(Number(d['abzug'] ?? 100)),
        belegnr: d['belegnr'] ? String(d['belegnr']) : null,
        aktiv: Boolean(d['aktiv']),
      },
    });
    return { ...a, id: Number(a.id), brutto: Number(a.brutto), mwst: Number(a.mwst), abzug: Number(a.abzug) };
  }

  async ausgabeLoeschen(id: number) {
    if (!await this.prisma.wiederkehrendeAusgaben.findUnique({ where: { id: BigInt(id) } })) throw new NotFoundException();
    await this.prisma.wiederkehrendeAusgaben.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }

  async rechnungenLaden() {
    const rows = await this.prisma.wiederkehrendeRechnungen.findMany({ orderBy: { titel: 'asc' } });
    return rows.map(r => ({ ...r, id: Number(r.id), kunden_id: r.kunden_id ? Number(r.kunden_id) : null }));
  }

  async rechnungErstellen(d: Record<string, unknown>) {
    const r = await this.prisma.wiederkehrendeRechnungen.create({
      data: {
        kunden_id: d['kunden_id'] ? BigInt(Number(d['kunden_id'])) : null,
        kunden_name: d['kunden_name'] ? String(d['kunden_name']) : null,
        titel: String(d['titel'] ?? ''),
        positionen: (d['positionen'] as Prisma.InputJsonValue) ?? [],
        intervall: d['intervall'] ? String(d['intervall']) : 'monatlich',
        aktiv: d['aktiv'] !== false,
      },
    });
    return { ...r, id: Number(r.id), kunden_id: r.kunden_id ? Number(r.kunden_id) : null };
  }

  async rechnungAktualisieren(id: number, d: Record<string, unknown>) {
    if (!await this.prisma.wiederkehrendeRechnungen.findUnique({ where: { id: BigInt(id) } })) throw new NotFoundException();
    const r = await this.prisma.wiederkehrendeRechnungen.update({
      where: { id: BigInt(id) },
      data: {
        kunden_id: d['kunden_id'] ? BigInt(Number(d['kunden_id'])) : null,
        kunden_name: d['kunden_name'] ? String(d['kunden_name']) : null,
        titel: String(d['titel'] ?? ''),
        positionen: (d['positionen'] as Prisma.InputJsonValue) ?? [],
        intervall: d['intervall'] ? String(d['intervall']) : 'monatlich',
        aktiv: Boolean(d['aktiv']),
        letzte_erstellung: d['letzte_erstellung'] ? new Date(String(d['letzte_erstellung'])) : null,
      },
    });
    return { ...r, id: Number(r.id), kunden_id: r.kunden_id ? Number(r.kunden_id) : null };
  }

  async rechnungLoeschen(id: number) {
    if (!await this.prisma.wiederkehrendeRechnungen.findUnique({ where: { id: BigInt(id) } })) throw new NotFoundException();
    await this.prisma.wiederkehrendeRechnungen.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }
}
