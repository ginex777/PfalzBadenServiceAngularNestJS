import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { PrismaService } from '../../core/database/prisma.service';

function calcTax(brutto: number, mwst: number) {
  const ust = brutto - brutto / (1 + mwst / 100);
  return { netto: brutto - ust, ust };
}

function toDatevStr(s: string): string {
  return String(s || '')
    .replace(/ÃƒÂ¤/g, 'ae')
    .replace(/ÃƒÂ¶/g, 'oe')
    .replace(/ÃƒÂ¼/g, 'ue')
    .replace(/Ãƒâ€ž/g, 'Ae')
    .replace(/Ãƒâ€“/g, 'Oe')
    .replace(/ÃƒÅ“/g, 'Ue')
    .replace(/ÃƒÅ¸/g, 'ss')
    .replace(/[^\u0020-\u007E]/g, '?');
}

function einnahmenKonto(mwst: number): string {
  if (mwst === 7) return '8300';
  if (mwst === 0) return '8100';
  return '8400';
}

function ausgabenKonto(kategorie: string): string {
  const k = (kategorie || '').toLowerCase();
  if (k.includes('bÃƒÂ¼romaterial') || k.includes('material')) return '4930';
  if (k.includes('kfz') || k.includes('pkw') || k.includes('fahrzeug'))
    return '4530';
  if (k.includes('telefon') || k.includes('internet')) return '4920';
  if (k.includes('miete') || k.includes('bÃƒÂ¼ro') || k.includes('raum'))
    return '4210';
  if (k.includes('versicherung')) return '4360';
  if (k.includes('werbung') || k.includes('marketing')) return '4600';
  if (k.includes('lohn') || k.includes('gehalt')) return '4120';
  if (k.includes('reise')) return '4670';
  if (k.includes('bewirtung')) return '4650';
  if (k.includes('fortbildung')) return '4900';
  if (k.includes('bank') || k.includes('konto') || k.includes('bankgebÃƒÂ¼hr'))
    return '4970';
  if (k.includes('software') || k.includes('it') || k.includes('webhosting'))
    return '4980';
  if (k.includes('geschenk')) return '4630';
  return '4980';
}

function toBelegdatum(d: Date | null): string {
  if (!d) return '';
  return (
    String(d.getDate()).padStart(2, '0') +
    String(d.getMonth() + 1).padStart(2, '0')
  );
}

function buildDatevRow(r: Record<string, unknown>): string {
  const brutto = Number(r['brutto'] ?? 0);
  const mwst = Number(r['mwst'] ?? 19);
  const abzug = Number(r['abzug'] ?? 100);
  const isInc = r['typ'] === 'inc';
  const betrag = isInc ? brutto : brutto * (abzug / 100);
  const konto = isInc
    ? einnahmenKonto(mwst)
    : ausgabenKonto(String(r['kategorie'] ?? ''));
  const shKz = isInc ? 'H' : 'S';
  let buSchluessel = '';
  if (isInc && mwst === 0) buSchluessel = '40';
  else if (!isInc && abzug === 0) buSchluessel = '40';
  const fields = new Array<string>(92).fill('');
  fields[0] = betrag.toFixed(2).replace('.', ',');
  fields[1] = shKz;
  fields[2] = 'EUR';
  fields[6] = konto;
  fields[7] = '1200';
  fields[8] = buSchluessel;
  fields[9] = toBelegdatum(
    r['datum'] instanceof Date
      ? r['datum']
      : r['datum']
        ? new Date(String(r['datum']))
        : null,
  );
  fields[10] = toDatevStr(String(r['renr'] ?? r['belegnr'] ?? '').slice(0, 12));
  fields[13] = toDatevStr(String(r['name'] ?? '').slice(0, 60));
  if (r['beleg_id']) {
    fields[19] = `http://localhost:3000/api/belege/${r['beleg_id']}/download?inline=1`;
  }
  return fields
    .map((field) =>
      String(field).includes(';') || String(field).includes('"')
        ? `"${String(field).replace(/"/g, '""')}"`
        : field,
    )
    .join(';');
}

function buildDatevHeader(
  jahr: number,
  monat: number,
  beraternr: string,
  mandantennr: string,
): string {
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const wjBeginn = `${jahr}0101`;
  const datumVon =
    monat >= 0 && monat <= 11
      ? `${jahr}${String(monat + 1).padStart(2, '0')}01`
      : `${jahr}0101`;
  const datumBis =
    monat >= 0 && monat <= 11
      ? `${jahr}${String(monat + 1).padStart(2, '0')}${String(new Date(jahr, monat + 1, 0).getDate()).padStart(2, '0')}`
      : `${jahr}1231`;
  const bezeichnung =
    monat >= 0 && monat <= 11
      ? `Buchhaltung ${MONATE_DE[monat]} ${jahr}`
      : `Buchhaltung Gesamtjahr ${jahr}`;
  return [
    '"EXTF"',
    '700',
    '21',
    '"Buchungsstapel"',
    '21',
    ts,
    '""',
    '""',
    '""',
    '""',
    '""',
    beraternr,
    mandantennr,
    wjBeginn,
    '4',
    datumVon,
    datumBis,
    `"${toDatevStr(bezeichnung)}"`,
    '"1"',
    '1',
    '""',
    '""',
    '""',
    '""',
  ].join(';');
}

const MONATE_DE = [
  'Januar',
  'Februar',
  'Maerz',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

const DATEV_COLUMNS = [
  'Umsatz (ohne Soll/Haben-Kz)',
  'Soll/Haben-Kennzeichen',
  'WKZ Umsatz',
  'Kurs',
  'Basis-Umsatz',
  'WKZ Basis-Umsatz',
  'Konto',
  'Gegenkonto (ohne BU-Schluessel)',
  'BU-Schluessel',
  'Belegdatum',
  'Belegfeld 1',
  'Belegfeld 2',
  'Skonto',
  'Buchungstext',
  'Postensperre',
  'Diverse Adressnummer',
  'Geschaeftspartnerbank',
  'Sachverhalt',
  'Zinssperre',
  'Beleglink',
  ...Array<string>(72).fill(''),
];

@Injectable()
export class DatevService {
  constructor(private readonly prisma: PrismaService) {}

  private async loadBookings(jahr: number, monat: number) {
    return this.prisma.buchhaltung.findMany({
      where: monat >= 0 && monat <= 11 ? { jahr, monat } : { jahr },
      orderBy: [{ monat: 'asc' }, { datum: 'asc' }, { id: 'asc' }],
    });
  }

  private async loadCompanySettings(): Promise<Record<string, string>> {
    const settings = await this.prisma.settings.findUnique({
      where: { key: 'firma' },
    });
    try {
      return settings
        ? (JSON.parse(settings.value) as Record<string, string>)
        : {};
    } catch {
      return {};
    }
  }

  async validate(jahr: number, monat: number) {
    const firma = await this.loadCompanySettings();
    const rows = await this.loadBookings(jahr, monat);
    const warnings: Array<{ typ: string; msg: string; count: number }> = [];
    const required = {
      steuernr: 'Steuernummer',
      datev_beraternr: 'DATEV Beraternummer',
      datev_mandantennr: 'DATEV Mandantennummer',
      firma: 'Firmenname',
    };
    for (const [key, label] of Object.entries(required)) {
      if (!firma[key])
        warnings.push({
          typ: 'error',
          msg: `Firmendaten: "${label}" fehlt`,
          count: 1,
        });
    }
    if (rows.length === 0) {
      warnings.push({
        typ: 'error',
        msg: 'Keine Buchungen fÃƒÂ¼r diesen Zeitraum',
        count: 0,
      });
      return { ok: false, warnings, stats: { totalRows: 0 } };
    }
    const ohneDatum = rows.filter((row) => !row.datum).length;
    const ohneName = rows.filter((row) => !row.name).length;
    const ohneBelegnr = rows.filter((row) => !row.belegnr).length;
    if (ohneDatum > 0)
      warnings.push({
        typ: 'error',
        msg: `${ohneDatum} Buchung(en) ohne Datum`,
        count: ohneDatum,
      });
    if (ohneName > 0)
      warnings.push({
        typ: 'warning',
        msg: `${ohneName} Buchung(en) ohne Bezeichnung`,
        count: ohneName,
      });
    if (ohneBelegnr > 0) {
      warnings.push({
        typ: 'warning',
        msg: `${ohneBelegnr} Buchung(en) ohne Belegnummer (GoBD Ã‚Â§146 AO)`,
        count: ohneBelegnr,
      });
    }
    return {
      ok: warnings.every((warning) => warning.typ !== 'error'),
      warnings,
      stats: { totalRows: rows.length },
    };
  }

  async preview(jahr: number, monat: number) {
    const rows = await this.loadBookings(jahr, monat);
    let sumIncNetto = 0;
    let sumExpNetto = 0;
    let sumUst = 0;
    let sumVst = 0;
    const mapped = rows.map((row) => {
      const brutto = Number(row.brutto);
      const mwst = Number(row.mwst);
      const abzug = Number(row.abzug);
      const { netto, ust } = calcTax(brutto, mwst);
      const isInc = row.typ === 'inc';
      const effNetto = isInc ? netto : netto * (abzug / 100);
      const effUst = isInc ? ust : ust * (abzug / 100);
      if (isInc) {
        sumIncNetto += effNetto;
        sumUst += effUst;
      } else {
        sumExpNetto += effNetto;
        sumVst += effUst;
      }
      return {
        datum: row.datum?.toISOString().slice(0, 10) ?? '',
        typ: row.typ,
        name: row.name ?? '',
        brutto,
        mwst,
        netto: parseFloat(effNetto.toFixed(2)),
        ust: parseFloat(effUst.toFixed(2)),
        konto: isInc
          ? einnahmenKonto(mwst)
          : ausgabenKonto(row.kategorie ?? ''),
        shKz: isInc ? 'H' : 'S',
        belegnr: row.belegnr ?? row.renr ?? '',
        kategorie: row.kategorie ?? '',
      };
    });
    return {
      rows: mapped,
      stats: {
        totalInc: mapped.filter((row) => row.typ === 'inc').length,
        totalExp: mapped.filter((row) => row.typ === 'exp').length,
        sumIncNetto: parseFloat(sumIncNetto.toFixed(2)),
        sumExpNetto: parseFloat(sumExpNetto.toFixed(2)),
        zahllast: parseFloat((sumUst - sumVst).toFixed(2)),
      },
    };
  }

  async buildCsvExport(jahr: number, monat: number) {
    const firma = await this.loadCompanySettings();
    const rows = await this.loadBookings(jahr, monat);
    const beraternr = firma['datev_beraternr'] ?? '99999';
    const mandantennr = firma['datev_mandantennr'] ?? '1';
    const header1 = buildDatevHeader(jahr, monat, beraternr, mandantennr);
    const header2 = DATEV_COLUMNS.slice(0, 20).join(';') + ';'.repeat(72);
    const dataRows = rows.map((row) =>
      buildDatevRow({
        ...row,
        id: Number(row.id),
        brutto: Number(row.brutto),
        mwst: Number(row.mwst),
        abzug: Number(row.abzug),
      }),
    );
    const monatLabel =
      monat >= 0 && monat <= 11 ? MONATE_DE[monat] : 'Gesamtjahr';
    return {
      filename: `DATEV_Buchungsstapel_${jahr}_${monatLabel}.csv`,
      content: [header1, header2, ...dataRows].join('\r\n'),
    };
  }

  async buildExcelExport(jahr: number, monat: number) {
    const firma = await this.loadCompanySettings();
    const rows = await this.loadBookings(jahr, monat);
    const buchungenData: Array<Array<string | number>> = [
      [
        'Datum',
        'Typ',
        'Kategorie',
        'Bezeichnung',
        'Beleg-Nr.',
        'Re-Nr.',
        'Brutto (EUR)',
        'MwSt %',
        'Abzug %',
        'Netto (EUR)',
        'USt (EUR)',
        'SKR03-Konto',
        'Gegenkonto',
        'S/H',
      ],
    ];
    rows.forEach((row) => {
      const brutto = Number(row.brutto);
      const mwst = Number(row.mwst);
      const abzug = Number(row.abzug);
      const { netto, ust } = calcTax(brutto, mwst);
      const isInc = row.typ === 'inc';
      buchungenData.push([
        row.datum?.toISOString().slice(0, 10) ?? '',
        isInc ? 'Einnahme' : 'Ausgabe',
        row.kategorie ?? '',
        row.name ?? '',
        row.belegnr ?? '',
        row.renr ?? '',
        brutto,
        mwst,
        abzug,
        parseFloat((isInc ? netto : netto * (abzug / 100)).toFixed(2)),
        parseFloat((isInc ? ust : ust * (abzug / 100)).toFixed(2)),
        isInc ? einnahmenKonto(mwst) : ausgabenKonto(row.kategorie ?? ''),
        '1200',
        isInc ? 'H' : 'S',
      ]);
    });

    const workbook = new Workbook();
    workbook.addWorksheet('Buchungen').addRows(buchungenData);
    const summaryData: Array<Array<string | number>> = [
      ['Firmenname:', firma['firma'] ?? ''],
      ['Steuernummer:', firma['steuernr'] ?? ''],
      ['USt-IdNr.:', firma['ustId'] ?? ''],
      ['Exportdatum:', new Date().toLocaleDateString('de-DE')],
      [
        'Zeitraum:',
        monat >= 0 && monat <= 11
          ? `${MONATE_DE[monat]} ${jahr}`
          : `Gesamtjahr ${jahr}`,
      ],
      [],
      [
        'Monat',
        'Einnahmen Netto',
        'USt',
        'Ausgaben Netto',
        'Vorsteuer',
        'Zahllast',
        'Gewinn',
      ],
    ];
    const monthRange =
      monat >= 0 && monat <= 11
        ? [monat]
        : Array.from({ length: 12 }, (_, index) => index);
    let totalInc = 0;
    let totalUst = 0;
    let totalExp = 0;
    let totalVst = 0;
    monthRange.forEach((monthIndex) => {
      const monthRows = rows.filter((row) => row.monat === monthIndex);
      let incNetto = 0;
      let ustTotal = 0;
      let expNetto = 0;
      let vstTotal = 0;
      monthRows.forEach((row) => {
        const brutto = Number(row.brutto);
        const mwst = Number(row.mwst);
        const abzug = Number(row.abzug);
        const { netto, ust } = calcTax(brutto, mwst);
        if (row.typ === 'inc') {
          incNetto += netto;
          ustTotal += ust;
        } else {
          expNetto += netto * (abzug / 100);
          vstTotal += ust * (abzug / 100);
        }
      });
      totalInc += incNetto;
      totalUst += ustTotal;
      totalExp += expNetto;
      totalVst += vstTotal;
      summaryData.push([
        `${MONATE_DE[monthIndex]} ${jahr}`,
        parseFloat(incNetto.toFixed(2)),
        parseFloat(ustTotal.toFixed(2)),
        parseFloat(expNetto.toFixed(2)),
        parseFloat(vstTotal.toFixed(2)),
        parseFloat((ustTotal - vstTotal).toFixed(2)),
        parseFloat((incNetto - expNetto).toFixed(2)),
      ]);
    });
    summaryData.push([
      'GESAMT',
      parseFloat(totalInc.toFixed(2)),
      parseFloat(totalUst.toFixed(2)),
      parseFloat(totalExp.toFixed(2)),
      parseFloat(totalVst.toFixed(2)),
      parseFloat((totalUst - totalVst).toFixed(2)),
      parseFloat((totalInc - totalExp).toFixed(2)),
    ]);
    workbook.addWorksheet('Zusammenfassung').addRows(summaryData);

    const monatLabel =
      monat >= 0 && monat <= 11 ? MONATE_DE[monat] : 'Gesamtjahr';
    return {
      filename: `DATEV_Excel_${jahr}_${monatLabel}.xlsx`,
      content: Buffer.from(await workbook.xlsx.writeBuffer()),
    };
  }
}
