import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Prisma, Buchhaltung } from '@prisma/client';
import { BuchhaltungEintragDto, VstDto } from './dto/buchhaltung.dto';

@Injectable()
export class BuchhaltungService {
  private readonly logger = new Logger(BuchhaltungService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getYearData(
    jahr: number,
  ): Promise<Record<number, { inc: unknown[]; exp: unknown[] }>> {
    const rows = await this.prisma.buchhaltung.findMany({
      where: { jahr },
      orderBy: [{ monat: 'asc' }, { id: 'asc' }],
    });
    const ergebnis: Record<number, { inc: unknown[]; exp: unknown[] }> = {};
    for (let m = 0; m < 12; m++) ergebnis[m] = { inc: [], exp: [] };
    rows.forEach((r) => {
      const monat = r.monat;
      const mapped = {
        ...r,
        id: Number(r.id),
        brutto: Number(r.brutto),
        mwst: Number(r.mwst),
        abzug: Number(r.abzug),
        beleg_id: r.beleg_id ? Number(r.beleg_id) : null,
      };
      if (r.typ === 'inc') ergebnis[monat].inc.push(mapped);
      else ergebnis[monat].exp.push(mapped);
    });
    return ergebnis;
  }

  async create(daten: BuchhaltungEintragDto) {
    await this.checkLockedMonth(daten.jahr, daten.monat);
    const row = await this.prisma.buchhaltung.create({
      data: this.mapEntryData(daten),
    });
    return this.mapBuchung(row);
  }

  async saveBatch(
    jahr: number,
    monat: number,
    zeilen: BuchhaltungEintragDto[],
  ) {
    await this.checkLockedMonth(jahr, monat);
    return this.prisma.$transaction(async (tx) => {
      const gespeichert: unknown[] = [];
      for (const z of zeilen) {
        if (z.id) {
          const updated = await tx.buchhaltung.update({
            where: { id: BigInt(z.id) },
            data: {
              name: z.name ?? null,
              datum: z.datum ? new Date(z.datum) : null,
              brutto: new Prisma.Decimal(z.brutto),
              mwst: new Prisma.Decimal(z.mwst ?? 19),
              abzug: new Prisma.Decimal(z.abzug ?? 100),
              kategorie: z.kategorie ?? null,
              renr: z.renr ?? null,
              belegnr: z.belegnr ?? null,
              beleg_id: z.beleg_id ? BigInt(z.beleg_id) : null,
            },
          });
          gespeichert.push(this.mapBuchung(updated));
        } else {
          const created = await tx.buchhaltung.create({
            data: this.mapEntryData({ ...z, jahr, monat }),
          });
          gespeichert.push(this.mapBuchung(created));
        }
      }
      return gespeichert;
    });
  }

  async update(id: number, daten: BuchhaltungEintragDto) {
    const alt = await this.prisma.buchhaltung.findUnique({
      where: { id: BigInt(id) },
    });
    if (!alt) throw new NotFoundException(`Eintrag ${id} nicht gefunden`);
    await this.checkLockedMonth(alt.jahr, alt.monat);
    const neu = await this.prisma.buchhaltung.update({
      where: { id: BigInt(id) },
      data: {
        name: daten.name ?? null,
        datum: daten.datum ? new Date(daten.datum) : null,
        brutto: new Prisma.Decimal(daten.brutto),
        mwst: new Prisma.Decimal(daten.mwst ?? 19),
        abzug: new Prisma.Decimal(daten.abzug ?? 100),
        kategorie: daten.kategorie ?? null,
        renr: daten.renr ?? null,
        belegnr: daten.belegnr ?? null,
      },
    });
    return this.mapBuchung(neu);
  }

  async delete(id: number) {
    const alt = await this.prisma.buchhaltung.findUnique({
      where: { id: BigInt(id) },
    });
    if (!alt) throw new NotFoundException(`Eintrag ${id} nicht gefunden`);
    await this.checkLockedMonth(alt.jahr, alt.monat);
    await this.prisma.buchhaltung.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }

  async getVst(jahr: number) {
    const rows = await this.prisma.vstPaid.findMany({ where: { jahr } });
    return rows.map((r) => ({ ...r, id: Number(r.id) }));
  }

  async saveVst(daten: VstDto) {
    const r = await this.prisma.vstPaid.upsert({
      where: { jahr_quartal: { jahr: daten.jahr, quartal: daten.quartal } },
      create: {
        jahr: daten.jahr,
        quartal: daten.quartal,
        paid: daten.paid ?? false,
        datum: daten.datum ? new Date(daten.datum) : null,
      },
      update: {
        paid: daten.paid ?? false,
        datum: daten.datum ? new Date(daten.datum) : null,
      },
    });
    return { ...r, id: Number(r.id) };
  }

  async getLockedMonths(jahr: number) {
    const rows = await this.prisma.gesperrteMonat.findMany({ where: { jahr } });
    return rows.map((r) => ({ ...r, id: Number(r.id) }));
  }

  async lockMonth(jahr: number, monat: number) {
    const r = await this.prisma.gesperrteMonat.upsert({
      where: { jahr_monat: { jahr, monat } },
      create: { jahr, monat },
      update: {},
    });
    return { ...r, id: Number(r.id) };
  }

  async unlockMonth(jahr: number, monat: number) {
    await this.prisma.gesperrteMonat.deleteMany({ where: { jahr, monat } });
    return { ok: true };
  }

  private async checkLockedMonth(jahr: number, monat: number): Promise<void> {
    const gesperrt = await this.prisma.gesperrteMonat.findUnique({
      where: { jahr_monat: { jahr, monat } },
    });
    if (gesperrt)
      throw new BadRequestException(
        'Dieser Monat ist gesperrt (GoBD §146 AO). Keine Änderungen möglich.',
      );
  }

  private mapEntryData(
    d: BuchhaltungEintragDto,
  ): Prisma.BuchhaltungCreateInput {
    return {
      jahr: d.jahr,
      monat: d.monat,
      typ: d.typ,
      name: d.name ?? null,
      datum: d.datum ? new Date(d.datum) : null,
      brutto: new Prisma.Decimal(d.brutto),
      mwst: new Prisma.Decimal(d.mwst ?? 19),
      abzug: new Prisma.Decimal(d.abzug ?? 100),
      kategorie: d.kategorie ?? null,
      renr: d.renr ?? null,
      belegnr: d.belegnr ?? null,
      beleg_id: d.beleg_id ? BigInt(d.beleg_id) : null,
    };
  }

  private mapBuchung(r: Buchhaltung) {
    return {
      ...r,
      id: Number(r.id),
      brutto: Number(r.brutto),
      mwst: Number(r.mwst),
      abzug: Number(r.abzug),
      beleg_id: r.beleg_id ? Number(r.beleg_id) : null,
    };
  }
}
