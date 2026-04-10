import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BuchhaltungService {
  constructor(private readonly prisma: PrismaService) {}

  async jahresDateLaden(jahr: number): Promise<Record<number, { inc: unknown[]; exp: unknown[] }>> {
    const rows = await this.prisma.buchhaltung.findMany({
      where: { jahr },
      orderBy: [{ monat: 'asc' }, { id: 'asc' }],
    });
    const ergebnis: Record<number, { inc: unknown[]; exp: unknown[] }> = {};
    for (let m = 0; m < 12; m++) ergebnis[m] = { inc: [], exp: [] };
    rows.forEach(r => {
      const monat = r.monat;
      const mapped = { ...r, id: Number(r.id), brutto: Number(r.brutto), mwst: Number(r.mwst), abzug: Number(r.abzug), beleg_id: r.beleg_id ? Number(r.beleg_id) : null };
      if (r.typ === 'inc') ergebnis[monat].inc.push(mapped);
      else ergebnis[monat].exp.push(mapped);
    });
    return ergebnis;
  }

  async eintragErstellen(daten: Record<string, unknown>) {
    await this.gesperrtenMonatPruefen(Number(daten['jahr']), Number(daten['monat']));
    const row = await this.prisma.buchhaltung.create({ data: this.buchungDatenMappen(daten) });
    return this.mapBuchung(row);
  }

  async batchSpeichern(jahr: number, monat: number, zeilen: Record<string, unknown>[]) {
    await this.gesperrtenMonatPruefen(jahr, monat);
    return this.prisma.$transaction(async (tx) => {
      const gespeichert: unknown[] = [];
      for (const z of zeilen) {
        if (z['id']) {
          const updated = await tx.buchhaltung.update({
            where: { id: BigInt(Number(z['id'])) },
            data: {
              name: z['name'] ? String(z['name']) : null,
              datum: z['datum'] ? new Date(String(z['datum'])) : null,
              brutto: new Prisma.Decimal(Number(z['brutto'] ?? 0)),
              mwst: new Prisma.Decimal(Number(z['mwst'] ?? 19)),
              abzug: new Prisma.Decimal(Number(z['abzug'] ?? 100)),
              kategorie: z['kategorie'] ? String(z['kategorie']) : null,
              renr: z['renr'] ? String(z['renr']) : null,
              belegnr: z['belegnr'] ? String(z['belegnr']) : null,
              beleg_id: z['beleg_id'] ? BigInt(Number(z['beleg_id'])) : null,
            },
          });
          gespeichert.push(this.mapBuchung(updated));
        } else {
          const created = await tx.buchhaltung.create({
            data: { ...this.buchungDatenMappen({ ...z, jahr, monat }) },
          });
          gespeichert.push(this.mapBuchung(created));
        }
      }
      return gespeichert;
    });
  }

  async eintragAktualisieren(id: number, daten: Record<string, unknown>) {
    const alt = await this.prisma.buchhaltung.findUnique({ where: { id: BigInt(id) } });
    if (!alt) throw new NotFoundException(`Eintrag ${id} nicht gefunden`);
    await this.gesperrtenMonatPruefen(alt.jahr, alt.monat);
    const neu = await this.prisma.buchhaltung.update({
      where: { id: BigInt(id) },
      data: {
        name: daten['name'] ? String(daten['name']) : null,
        datum: daten['datum'] ? new Date(String(daten['datum'])) : null,
        brutto: new Prisma.Decimal(Number(daten['brutto'] ?? 0)),
        mwst: new Prisma.Decimal(Number(daten['mwst'] ?? 19)),
        abzug: new Prisma.Decimal(Number(daten['abzug'] ?? 100)),
        kategorie: daten['kategorie'] ? String(daten['kategorie']) : null,
        renr: daten['renr'] ? String(daten['renr']) : null,
        belegnr: daten['belegnr'] ? String(daten['belegnr']) : null,
      },
    });
    return this.mapBuchung(neu);
  }

  async eintragLoeschen(id: number) {
    const alt = await this.prisma.buchhaltung.findUnique({ where: { id: BigInt(id) } });
    if (!alt) throw new NotFoundException(`Eintrag ${id} nicht gefunden`);
    await this.gesperrtenMonatPruefen(alt.jahr, alt.monat);
    await this.prisma.buchhaltung.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }

  async vstLaden(jahr: number) {
    const rows = await this.prisma.vstPaid.findMany({ where: { jahr } });
    return rows.map(r => ({ ...r, id: Number(r.id) }));
  }

  async vstSpeichern(daten: Record<string, unknown>) {
    const r = await this.prisma.vstPaid.upsert({
      where: { jahr_quartal: { jahr: Number(daten['jahr']), quartal: String(daten['quartal']) } },
      create: { jahr: Number(daten['jahr']), quartal: String(daten['quartal']), paid: Boolean(daten['paid']), datum: daten['datum'] ? new Date(String(daten['datum'])) : null },
      update: { paid: Boolean(daten['paid']), datum: daten['datum'] ? new Date(String(daten['datum'])) : null },
    });
    return { ...r, id: Number(r.id) };
  }

  async gesperrteMonateLaden(jahr: number) {
    const rows = await this.prisma.gesperrteMonat.findMany({ where: { jahr } });
    return rows.map(r => ({ ...r, id: Number(r.id) }));
  }

  async monatSperren(jahr: number, monat: number) {
    const r = await this.prisma.gesperrteMonat.upsert({
      where: { jahr_monat: { jahr, monat } },
      create: { jahr, monat },
      update: {},
    });
    return { ...r, id: Number(r.id) };
  }

  async monatEntsperren(jahr: number, monat: number) {
    await this.prisma.gesperrteMonat.deleteMany({ where: { jahr, monat } });
    return { ok: true };
  }

  private async gesperrtenMonatPruefen(jahr: number, monat: number): Promise<void> {
    const gesperrt = await this.prisma.gesperrteMonat.findUnique({ where: { jahr_monat: { jahr, monat } } });
    if (gesperrt) throw new BadRequestException('Dieser Monat ist gesperrt (GoBD §146 AO). Keine Änderungen möglich.');
  }

  private buchungDatenMappen(d: Record<string, unknown>): Prisma.BuchhaltungCreateInput {
    return {
      jahr: Number(d['jahr']),
      monat: Number(d['monat']),
      typ: String(d['typ'] ?? 'exp'),
      name: d['name'] ? String(d['name']) : null,
      datum: d['datum'] ? new Date(String(d['datum'])) : null,
      brutto: new Prisma.Decimal(Number(d['brutto'] ?? 0)),
      mwst: new Prisma.Decimal(Number(d['mwst'] ?? 19)),
      abzug: new Prisma.Decimal(Number(d['abzug'] ?? 100)),
      kategorie: d['kategorie'] ? String(d['kategorie']) : null,
      renr: d['renr'] ? String(d['renr']) : null,
      belegnr: d['belegnr'] ? String(d['belegnr']) : null,
      beleg_id: d['beleg_id'] ? BigInt(Number(d['beleg_id'])) : null,
    };
  }

  private mapBuchung(r: Record<string, unknown>) {
    return { ...r, id: Number(r['id']), brutto: Number(r['brutto']), mwst: Number(r['mwst']), abzug: Number(r['abzug']), beleg_id: r['beleg_id'] ? Number(r['beleg_id']) : null };
  }
}
