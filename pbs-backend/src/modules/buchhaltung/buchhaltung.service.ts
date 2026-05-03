import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { PrismaService } from '../../core/database/prisma.service';
import type { Buchhaltung } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { BuchhaltungEintragDto, VstDto } from './dto/buchhaltung.dto';

export interface AccountingMonthSummary {
  month: number;
  incomeNet: number;
  incomeVat: number;
  expenseNet: number;
  inputVat: number;
  vatLiability: number;
  profit: number;
}

export interface AccountingElsterSummary {
  kz81: number;
  kz83: number;
  kz86: number;
  kz85: number;
  kz66: number;
}

export interface AccountingQuarterSummary extends Omit<
  AccountingMonthSummary,
  'month'
> {
  key: string;
  label: string;
  months: number[];
  elster: AccountingElsterSummary;
}

export interface AccountingYearSummary {
  months: AccountingMonthSummary[];
  quarters: AccountingQuarterSummary[];
}

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

  async getYearSummary(jahr: number): Promise<AccountingYearSummary> {
    const rows = await this.prisma.buchhaltung.findMany({
      where: { jahr },
      orderBy: [{ monat: 'asc' }, { id: 'asc' }],
    });
    return this.calculateYearSummary(rows);
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

  private calculateYearSummary(rows: Buchhaltung[]): AccountingYearSummary {
    const months = Array.from({ length: 12 }, (_, month) =>
      this.calculateMonthSummary(
        month,
        rows.filter((row) => row.monat === month),
      ),
    );
    const quarterDefinitions = [
      { key: 'q0', label: 'Q1 (Jan-Mrz)', months: [0, 1, 2] },
      { key: 'q1', label: 'Q2 (Apr-Jun)', months: [3, 4, 5] },
      { key: 'q2', label: 'Q3 (Jul-Sep)', months: [6, 7, 8] },
      { key: 'q3', label: 'Q4 (Okt-Dez)', months: [9, 10, 11] },
    ];
    const quarters = quarterDefinitions.map((quarter) => {
      const quarterMonths = months.filter((summary) =>
        quarter.months.includes(summary.month),
      );
      const elster = this.calculateElsterSummary(
        rows.filter((row) => quarter.months.includes(row.monat)),
      );
      const incomeNet = this.sum(quarterMonths.map((month) => month.incomeNet));
      const incomeVat = this.sum(quarterMonths.map((month) => month.incomeVat));
      const expenseNet = this.sum(
        quarterMonths.map((month) => month.expenseNet),
      );
      const inputVat = this.sum(quarterMonths.map((month) => month.inputVat));
      return {
        key: quarter.key,
        label: quarter.label,
        months: quarter.months,
        elster,
        incomeNet,
        incomeVat,
        expenseNet,
        inputVat,
        vatLiability: this.roundCurrency(incomeVat - inputVat),
        profit: this.roundCurrency(incomeNet - expenseNet),
      };
    });
    return { months, quarters };
  }

  private calculateMonthSummary(
    month: number,
    rows: Buchhaltung[],
  ): AccountingMonthSummary {
    let incomeNet = 0;
    let incomeVat = 0;
    let expenseNet = 0;
    let inputVat = 0;

    for (const row of rows) {
      const gross = Number(row.brutto);
      const vatRate = Number(row.mwst);
      const businessShare = Number(row.abzug) / 100;
      const vat = this.calculateVatFromGross(gross, vatRate);
      const net = this.roundCurrency(gross - vat);

      if (row.typ === 'inc') {
        incomeVat += vat;
        incomeNet += net;
      } else {
        inputVat += vat * businessShare;
        expenseNet += net * businessShare;
      }
    }

    incomeNet = this.roundCurrency(incomeNet);
    incomeVat = this.roundCurrency(incomeVat);
    expenseNet = this.roundCurrency(expenseNet);
    inputVat = this.roundCurrency(inputVat);

    return {
      month,
      incomeNet,
      incomeVat,
      expenseNet,
      inputVat,
      vatLiability: this.roundCurrency(incomeVat - inputVat),
      profit: this.roundCurrency(incomeNet - expenseNet),
    };
  }

  private calculateElsterSummary(rows: Buchhaltung[]): AccountingElsterSummary {
    let kz81 = 0;
    let kz83 = 0;
    let kz86 = 0;
    let kz85 = 0;
    let kz66 = 0;

    for (const row of rows) {
      const gross = Number(row.brutto);
      const vatRate = Number(row.mwst);
      const vat = this.calculateVatFromGross(gross, vatRate);
      const net = this.roundCurrency(gross - vat);
      if (row.typ === 'inc' && vatRate === 19) {
        kz81 += net;
        kz83 += vat;
      } else if (row.typ === 'inc' && vatRate === 7) {
        kz86 += net;
        kz85 += vat;
      } else if (row.typ === 'exp') {
        kz66 += vat * (Number(row.abzug) / 100);
      }
    }

    return {
      kz81: this.roundCurrency(kz81),
      kz83: this.roundCurrency(kz83),
      kz86: this.roundCurrency(kz86),
      kz85: this.roundCurrency(kz85),
      kz66: this.roundCurrency(kz66),
    };
  }

  private calculateVatFromGross(gross: number, vatRate: number): number {
    if (vatRate <= 0) return 0;
    return this.roundCurrency(gross - gross / (1 + vatRate / 100));
  }

  private sum(values: number[]): number {
    return this.roundCurrency(
      values.reduce((total, value) => total + value, 0),
    );
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
