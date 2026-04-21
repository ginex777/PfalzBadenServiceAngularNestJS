import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../../core/database/prisma.service';

function calcTax(brutto: number, mwst: number) {
  const ust = brutto - brutto / (1 + mwst / 100);
  return { netto: brutto - ust, ust };
}

function toDatevStr(s: string): string {
  return (
    String(s || '')
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/Ä/g, 'Ae')
      .replace(/Ö/g, 'Oe')
      .replace(/Ü/g, 'Ue')
      .replace(/ß/g, 'ss')
      // Replace non-ASCII with safe placeholder (DATEV CSV compatibility)
      .replace(/[^\u0020-\u007E]/g, '?')
  );
}

function einnahmenKonto(mwst: number): string {
  if (mwst === 7) return '8300';
  if (mwst === 0) return '8100';
  return '8400';
}

function ausgabenKonto(kategorie: string): string {
  const k = (kategorie || '').toLowerCase();
  if (k.includes('büromaterial') || k.includes('material')) return '4930';
  if (k.includes('kfz') || k.includes('pkw') || k.includes('fahrzeug'))
    return '4530';
  if (k.includes('telefon') || k.includes('internet')) return '4920';
  if (k.includes('miete') || k.includes('büro') || k.includes('raum'))
    return '4210';
  if (k.includes('versicherung')) return '4360';
  if (k.includes('werbung') || k.includes('marketing')) return '4600';
  if (k.includes('lohn') || k.includes('gehalt')) return '4120';
  if (k.includes('reise')) return '4670';
  if (k.includes('bewirtung')) return '4650';
  if (k.includes('fortbildung')) return '4900';
  if (k.includes('bank') || k.includes('konto') || k.includes('bankgebühr'))
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
  const { netto: _netto, ust: _ust } = calcTax(brutto, mwst);
  const isInc = r['typ'] === 'inc';
  const betrag = isInc ? brutto : brutto * (abzug / 100);
  const konto = isInc
    ? einnahmenKonto(mwst)
    : ausgabenKonto(String(r['kategorie'] ?? ''));
  const shKz = isInc ? 'H' : 'S';
  let buSchluessel = '';
  if (isInc && mwst === 0) buSchluessel = '40';
  else if (!isInc && abzug === 0) buSchluessel = '40';
  const fields = new Array(92).fill('');
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
  if (r['beleg_id'])
    fields[19] = `http://localhost:3000/api/belege/${r['beleg_id']}/download?inline=1`;
  return fields
    .map((f) =>
      String(f).includes(';') || String(f).includes('"')
        ? `"${String(f).replace(/"/g, '""')}"`
        : f,
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
  let datumVon: string, datumBis: string;
  if (monat >= 0 && monat <= 11) {
    const lastDay = new Date(jahr, monat + 1, 0).getDate();
    datumVon = `${jahr}${String(monat + 1).padStart(2, '0')}01`;
    datumBis = `${jahr}${String(monat + 1).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`;
  } else {
    datumVon = `${jahr}0101`;
    datumBis = `${jahr}1231`;
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
  ...Array(72).fill(''),
];

@Controller('api/datev')
export class DatevController {
  constructor(private readonly prisma: PrismaService) {}

  private async buchungenLaden(jahr: number, monat: number) {
    return this.prisma.buchhaltung.findMany({
      where: monat >= 0 && monat <= 11 ? { jahr, monat } : { jahr },
      orderBy: [{ monat: 'asc' }, { datum: 'asc' }, { id: 'asc' }],
    });
  }

  private async firmaLaden() {
    const s = await this.prisma.settings.findUnique({
      where: { key: 'firma' },
    });
    try {
      return s ? (JSON.parse(s.value) as Record<string, string>) : {};
    } catch {
      return {};
    }
  }

  @Get('validate')
  async validieren(@Query('jahr') jahr: string, @Query('monat') monat: string) {
    const j = parseInt(jahr),
      m = monat !== undefined ? parseInt(monat) : -1;
    const firma = await this.firmaLaden();
    const rows = await this.buchungenLaden(j, m);
    const warnings: { typ: string; msg: string; count: number }[] = [];
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
        msg: 'Keine Buchungen für diesen Zeitraum',
        count: 0,
      });
      return { ok: false, warnings, stats: { totalRows: 0 } };
    }
    const ohneDatum = rows.filter((r) => !r.datum).length;
    const ohneName = rows.filter((r) => !r.name).length;
    const ohneBelegnr = rows.filter((r) => !r.belegnr).length;
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
    if (ohneBelegnr > 0)
      warnings.push({
        typ: 'warning',
        msg: `${ohneBelegnr} Buchung(en) ohne Belegnummer (GoBD §146 AO)`,
        count: ohneBelegnr,
      });
    return {
      ok: warnings.every((w) => w.typ !== 'error'),
      warnings,
      stats: { totalRows: rows.length },
    };
  }

  @Get('preview')
  async vorschau(@Query('jahr') jahr: string, @Query('monat') monat: string) {
    const j = parseInt(jahr),
      m = monat !== undefined ? parseInt(monat) : -1;
    const rows = await this.buchungenLaden(j, m);
    let sumIncNetto = 0,
      sumExpNetto = 0,
      sumUst = 0,
      sumVst = 0;
    const mapped = rows.map((r) => {
      const brutto = Number(r.brutto),
        mwstR = Number(r.mwst),
        abzug = Number(r.abzug);
      const { netto, ust } = calcTax(brutto, mwstR);
      const isInc = r.typ === 'inc';
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
        datum: r.datum?.toISOString().slice(0, 10) ?? '',
        typ: r.typ,
        name: r.name ?? '',
        brutto,
        mwst: mwstR,
        netto: parseFloat(effNetto.toFixed(2)),
        ust: parseFloat(effUst.toFixed(2)),
        konto: isInc ? einnahmenKonto(mwstR) : ausgabenKonto(r.kategorie ?? ''),
        shKz: isInc ? 'H' : 'S',
        belegnr: r.belegnr ?? r.renr ?? '',
        kategorie: r.kategorie ?? '',
      };
    });
    return {
      rows: mapped,
      stats: {
        totalInc: mapped.filter((r) => r.typ === 'inc').length,
        totalExp: mapped.filter((r) => r.typ === 'exp').length,
        sumIncNetto: parseFloat(sumIncNetto.toFixed(2)),
        sumExpNetto: parseFloat(sumExpNetto.toFixed(2)),
        zahllast: parseFloat((sumUst - sumVst).toFixed(2)),
      },
    };
  }

  @Get('export')
  async csvExport(
    @Query('jahr') jahr: string,
    @Query('monat') monat: string,
    @Res() res: Response,
  ) {
    const j = parseInt(jahr),
      m = monat !== undefined ? parseInt(monat) : -1;
    const firma = await this.firmaLaden();
    const beraternr = firma['datev_beraternr'] ?? '99999';
    const mandantennr = firma['datev_mandantennr'] ?? '1';
    const rows = await this.buchungenLaden(j, m);
    const header1 = buildDatevHeader(j, m, beraternr, mandantennr);
    const header2 = DATEV_COLUMNS.slice(0, 20).join(';') + ';'.repeat(72);
    const dataRows = rows.map((r) =>
      buildDatevRow({
        ...r,
        id: Number(r.id),
        brutto: Number(r.brutto),
        mwst: Number(r.mwst),
        abzug: Number(r.abzug),
      }),
    );
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
    const monatLabel = m >= 0 && m <= 11 ? MONATE_DE[m] : 'Gesamtjahr';
    const csv = [header1, header2, ...dataRows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=windows-1252');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="DATEV_Buchungsstapel_${j}_${monatLabel}.csv"`,
    );
    res.send(csv);
  }

  @Get('excel')
  async excelExport(
    @Query('jahr') jahr: string,
    @Query('monat') monat: string,
    @Res() res: Response,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require('xlsx') as typeof import('xlsx');
    const j = parseInt(jahr),
      m = monat !== undefined ? parseInt(monat) : -1;
    const firma = await this.firmaLaden();
    const rows = await this.buchungenLaden(j, m);
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

    const buchungenData: (string | number)[][] = [
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
    rows.forEach((r) => {
      const brutto = Number(r.brutto),
        mwstR = Number(r.mwst),
        abzug = Number(r.abzug);
      const { netto, ust } = calcTax(brutto, mwstR);
      const isInc = r.typ === 'inc';
      buchungenData.push([
        r.datum?.toISOString().slice(0, 10) ?? '',
        isInc ? 'Einnahme' : 'Ausgabe',
        r.kategorie ?? '',
        r.name ?? '',
        r.belegnr ?? '',
        r.renr ?? '',
        brutto,
        mwstR,
        abzug,
        parseFloat((isInc ? netto : netto * (abzug / 100)).toFixed(2)),
        parseFloat((isInc ? ust : ust * (abzug / 100)).toFixed(2)),
        isInc ? einnahmenKonto(mwstR) : ausgabenKonto(r.kategorie ?? ''),
        '1200',
        isInc ? 'H' : 'S',
      ]);
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(buchungenData),
      'Buchungen',
    );

    const summaryData: (string | number)[][] = [
      ['Firmenname:', firma['firma'] ?? ''],
      ['Steuernummer:', firma['steuernr'] ?? ''],
      ['USt-IdNr.:', firma['ustId'] ?? ''],
      ['Exportdatum:', new Date().toLocaleDateString('de-DE')],
      [
        'Zeitraum:',
        m >= 0 && m <= 11 ? `${MONATE_DE[m]} ${j}` : `Gesamtjahr ${j}`,
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
      m >= 0 && m <= 11 ? [m] : Array.from({ length: 12 }, (_, i) => i);
    let tI = 0,
      tU = 0,
      tE = 0,
      tV = 0;
    monthRange.forEach((mo) => {
      const mRows = rows.filter((r) => r.monat === mo);
      let incN = 0,
        ust = 0,
        expN = 0,
        vst = 0;
      mRows.forEach((r) => {
        const b = Number(r.brutto),
          mw = Number(r.mwst),
          ab = Number(r.abzug);
        const { netto, ust: u } = calcTax(b, mw);
        if (r.typ === 'inc') {
          incN += netto;
          ust += u;
        } else {
          expN += netto * (ab / 100);
          vst += u * (ab / 100);
        }
      });
      tI += incN;
      tU += ust;
      tE += expN;
      tV += vst;
      summaryData.push([
        `${MONATE_DE[mo]} ${j}`,
        parseFloat(incN.toFixed(2)),
        parseFloat(ust.toFixed(2)),
        parseFloat(expN.toFixed(2)),
        parseFloat(vst.toFixed(2)),
        parseFloat((ust - vst).toFixed(2)),
        parseFloat((incN - expN).toFixed(2)),
      ]);
    });
    summaryData.push([
      'GESAMT',
      parseFloat(tI.toFixed(2)),
      parseFloat(tU.toFixed(2)),
      parseFloat(tE.toFixed(2)),
      parseFloat(tV.toFixed(2)),
      parseFloat((tU - tV).toFixed(2)),
      parseFloat((tI - tE).toFixed(2)),
    ]);
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(summaryData),
      'Zusammenfassung',
    );

    const monatLabel = m >= 0 && m <= 11 ? MONATE_DE[m] : 'Gesamtjahr';
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="DATEV_Excel_${j}_${monatLabel}.xlsx"`,
    );
    res.send(buf);
  }
}
