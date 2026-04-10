import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PuppeteerService } from './puppeteer.service';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ── Handlebars Helpers ────────────────────────────────────────────────────────
Handlebars.registerHelper('fmtEur', (n: number) =>
  (n || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
);
Handlebars.registerHelper('posNr', (idx: number) => idx + 1);
Handlebars.registerHelper('fmtStunden', (n: number) =>
  (n || 0).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
);
Handlebars.registerHelper('bezHtml', (bez: string) => {
  if (!bez) return '';
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = bez.split('\n');
  let html = '', inList = false, firstLine = true;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('- ')) {
      if (!inList) { html += '<ul class="bez-list">'; inList = true; }
      html += `<li>${esc(t.slice(2))}</li>`;
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      if (t) { html += firstLine ? `<div><strong>${esc(t)}</strong></div>` : `<div>${esc(t)}</div>`; firstLine = false; }
      else html += '<div style="height:4px"></div>';
    }
  }
  if (inList) html += '</ul>';
  return new Handlebars.SafeString(html);
});

interface FirmaSettings {
  firma?: string; zusatz?: string; strasse?: string; ort?: string;
  steuernr?: string; ustId?: string; gf?: string; tel?: string;
  email?: string; bank?: string; iban?: string; bic?: string;
}

interface PdfToken { pdf: Buffer; filename: string }

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly tokenStore = new Map<string, { data: PdfToken; expires: number }>();
  private readonly pdfCache = new Map<string, Buffer>();
  private readonly CACHE_MAX = 30;
  private readonly TEMPLATE_DIR = path.join(__dirname, 'templates');
  private readonly logoBase64: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly puppeteer: PuppeteerService,
  ) {
    // Logo als Base64 einlesen (logo-base64.txt liegt neben den Templates)
    const logoTxtPath = path.join(__dirname, 'logo-base64.txt');
    try {
      this.logoBase64 = fs.readFileSync(logoTxtPath, 'utf-8').trim();
    } catch {
      this.logoBase64 = '';
      this.logger.warn('Logo-Base64 nicht gefunden: ' + logoTxtPath);
    }

    // Partials registrieren
    this.partialRegistrieren('header', 'partials/header.hbs');
    this.partialRegistrieren('footer', 'partials/footer.hbs');
    // Token-Store alle 60s aufräumen
    setInterval(() => this.abgelaufeneTokensLoeschen(), 60_000);
  }

  // ── Rechnung PDF ────────────────────────────────────────────────────────────
  async rechnungPdfErstellen(rechnungId: number): Promise<{ token: string; url: string }> {
    const rechnung = await this.prisma.rechnungen.findUnique({ where: { id: BigInt(rechnungId) } });
    if (!rechnung) throw new NotFoundException(`Rechnung ${rechnungId} nicht gefunden`);
    const firma = await this.firmaLaden();

    const positionen = (rechnung.positionen as { bez: string; stunden?: string; einzelpreis?: number; gesamtpreis: number }[]) ?? [];
    const mwstSatz = Number(rechnung.mwst_satz ?? 19);
    const netto = positionen.reduce((s, p) => s + (Number(p.gesamtpreis) || 0), 0);
    const ust = netto * (mwstSatz / 100);
    const brutto = netto + ust;

    const datumStr = rechnung.datum ? this.datumFormatieren(rechnung.datum.toISOString().slice(0, 10)) : '–';
    const zahlDatum = rechnung.datum ? this.addTage(rechnung.datum.toISOString().slice(0, 10), rechnung.zahlungsziel ?? 14) : '–';

    const kontext = {
      firma, logoBase64: this.logoBase64,
      rechnung: {
        ...rechnung,
        id: Number(rechnung.id),
        kunden_id: rechnung.kunden_id ? Number(rechnung.kunden_id) : null,
        brutto: Number(rechnung.brutto),
        mwst_satz: mwstSatz,
        positionen,
        datumFormatiert: datumStr,
        zahlDatumFormatiert: zahlDatum,
        mwstLabel: mwstSatz === 0 ? '0 % (steuerfrei)' : `${mwstSatz} %`,
        nettoFormatiert: this.fmtEur(netto),
        ustFormatiert: this.fmtEur(ust),
        bruttoFormatiert: this.fmtEur(brutto),
      },
    };

    const html = this.templateRendern('rechnung.hbs', kontext);
    const pdf = await this.pdfAusHtmlErstellen(html);
    const filename = `Rechnung_${rechnung.nr}.pdf`;

    await this.prisma.pdfArchive.create({
      data: {
        typ: 'rechnung', referenz_nr: rechnung.nr,
        referenz_id: rechnung.id, empf: rechnung.empf,
        titel: rechnung.titel ?? null,
        datum: rechnung.datum ?? null,
        filename, html_body: html,
      },
    });

    return this.tokenErstellen(pdf, filename);
  }

  // ── Angebot PDF ─────────────────────────────────────────────────────────────
  async angebotPdfErstellen(angebotId: number): Promise<{ token: string; url: string }> {
    const angebot = await this.prisma.angebote.findUnique({ where: { id: BigInt(angebotId) } });
    if (!angebot) throw new NotFoundException(`Angebot ${angebotId} nicht gefunden`);
    const firma = await this.firmaLaden();

    const positionen = (angebot.positionen as { bez: string; stunden?: string; einzelpreis?: number; gesamtpreis: number }[]) ?? [];
    const netto = positionen.reduce((s, p) => s + (Number(p.gesamtpreis) || 0), 0);
    const ust = netto * 0.19;
    const brutto = netto + ust;

    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

    const kontext = {
      firma, logoBase64: this.logoBase64,
      angebot: {
        ...angebot,
        id: Number(angebot.id),
        kunden_id: angebot.kunden_id ? Number(angebot.kunden_id) : null,
        brutto: Number(angebot.brutto),
        positionen,
        datumFormatiert: angebot.datum ? this.datumFormatieren(angebot.datum.toISOString().slice(0, 10)) : '–',
        gueltigBisFormatiert: angebot.gueltig_bis ? this.datumFormatieren(angebot.gueltig_bis.toISOString().slice(0, 10)) : '30 Tage',
        nettoFormatiert: this.fmtEur(netto),
        ustFormatiert: this.fmtEur(ust),
        bruttoFormatiert: this.fmtEur(brutto),
        zusatzHtml: angebot.zusatz ? new Handlebars.SafeString(esc(angebot.zusatz)) : null,
      },
    };

    const html = this.templateRendern('angebot.hbs', kontext);
    const pdf = await this.pdfAusHtmlErstellen(html);
    const filename = `Angebot_${angebot.nr}.pdf`;

    await this.prisma.pdfArchive.create({
      data: {
        typ: 'angebot', referenz_nr: angebot.nr,
        referenz_id: angebot.id, empf: angebot.empf,
        titel: angebot.titel ?? null,
        datum: angebot.datum ?? null,
        filename, html_body: html,
      },
    });

    return this.tokenErstellen(pdf, filename);
  }

  // ── EÜR PDF ─────────────────────────────────────────────────────────────────
  async euerPdfErstellen(jahr: number, ergebnis: Record<string, unknown>): Promise<{ token: string; url: string }> {
    const firma = await this.firmaLaden();
    const now = new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const kontext = { firma, logoBase64: this.logoBase64, jahr, erstelltAm: now, ...ergebnis };
    const html = this.templateRendern('euer.hbs', kontext);
    const pdf = await this.pdfAusHtmlErstellen(html);
    const filename = `EÜR_${jahr}.pdf`;

    await this.prisma.pdfArchive.create({
      data: { typ: 'euer', referenz_nr: String(jahr), filename, html_body: html },
    });

    return this.tokenErstellen(pdf, filename);
  }

  // ── Hausmeister Einzel-PDF ───────────────────────────────────────────────────
  async hausmeisterEinsatzPdfErstellen(einsatzId: number): Promise<{ token: string; url: string }> {
    const einsatz = await this.prisma.hausmeisterEinsaetze.findUnique({ where: { id: BigInt(einsatzId) } });
    if (!einsatz) throw new NotFoundException(`Einsatz ${einsatzId} nicht gefunden`);
    const firma = await this.firmaLaden();
    const now = new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const taetigkeiten = (einsatz.taetigkeiten as { beschreibung: string; stunden: number }[]) ?? [];

    const kontext = {
      firma, logoBase64: this.logoBase64, erstelltAm: now,
      einsatz: {
        ...einsatz,
        id: Number(einsatz.id),
        mitarbeiter_id: einsatz.mitarbeiter_id ? Number(einsatz.mitarbeiter_id) : null,
        kunden_id: einsatz.kunden_id ? Number(einsatz.kunden_id) : null,
        stunden_gesamt: Number(einsatz.stunden_gesamt),
        taetigkeiten,
        datumFormatiert: this.datumFormatieren(einsatz.datum.toISOString().slice(0, 10)),
      },
    };

    const html = this.templateRendern('hausmeister.hbs', kontext);
    const pdf = await this.pdfAusHtmlErstellen(html);
    const filename = `Hausmeister_${einsatz.mitarbeiter_name.replace(/\s+/g, '_')}_${einsatz.datum.toISOString().slice(0, 10)}.pdf`;

    await this.prisma.pdfArchive.create({
      data: {
        typ: 'hausmeister', referenz_nr: einsatz.datum.toISOString().slice(0, 10),
        referenz_id: einsatz.id, empf: einsatz.mitarbeiter_name,
        titel: `Hausmeisterdienste ${this.datumFormatieren(einsatz.datum.toISOString().slice(0, 10))}${einsatz.kunden_name ? ' – ' + einsatz.kunden_name : ''}`,
        datum: einsatz.datum, filename, html_body: html,
      },
    });

    return this.tokenErstellen(pdf, filename);
  }

  // ── Hausmeister Monatsnachweis-PDF ───────────────────────────────────────────
  async hausmeisterMonatsnachweisPdfErstellen(monat: string, mitarbeiterName?: string): Promise<{ token: string; url: string }> {
    const [y, mo] = monat.split('-').map(Number);
    const vonDatum = new Date(y, mo - 1, 1);
    const bisDatum = new Date(y, mo, 0);
    const firma = await this.firmaLaden();
    const now = new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const where = mitarbeiterName
      ? { datum: { gte: vonDatum, lte: bisDatum }, mitarbeiter_name: mitarbeiterName }
      : { datum: { gte: vonDatum, lte: bisDatum } };

    const rows = await this.prisma.hausmeisterEinsaetze.findMany({ where, orderBy: { datum: 'asc' } });
    const MONATE_DE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
    const monatName = `${MONATE_DE[mo - 1]} ${y}`;
    const titel = mitarbeiterName ? `Monatsnachweis ${mitarbeiterName} – ${monatName}` : `Monatsnachweis ${monatName}`;

    const einsaetze = rows.map(e => ({
      ...e, id: Number(e.id),
      stunden_gesamt: Number(e.stunden_gesamt),
      datumFormatiert: this.datumFormatieren(e.datum.toISOString().slice(0, 10)),
      taetigkeiten: (e.taetigkeiten as { beschreibung: string; stunden: number }[]) ?? [],
      taetigkeitenText: ((e.taetigkeiten as { beschreibung: string; stunden: number }[]) ?? [])
        .map(t => `${t.beschreibung} (${t.stunden.toLocaleString('de-DE', { minimumFractionDigits: 1 })}h)`).join(', '),
    }));

    const gesamtStunden = einsaetze.reduce((s, e) => s + e.stunden_gesamt, 0);
    const kontext = { firma, logoBase64: this.logoBase64, erstelltAm: now, titel, einsaetze, anzahl: einsaetze.length, gesamtStunden };

    const html = this.templateRendern('hausmeister-monat.hbs', kontext);
    const pdf = await this.pdfAusHtmlErstellen(html);
    const filename = `Monatsnachweis_Hausmeister_${mitarbeiterName ? mitarbeiterName.replace(/\s+/g, '_') + '_' : ''}${monat}.pdf`;

    await this.prisma.pdfArchive.create({
      data: { typ: 'hausmeister', referenz_nr: monat, empf: mitarbeiterName ?? 'Alle Mitarbeiter', titel, filename, html_body: html },
    });

    return this.tokenErstellen(pdf, filename);
  }

  // ── Mitarbeiter Stundenabrechnung-PDF ────────────────────────────────────────
  async mitarbeiterAbrechnungPdfErstellen(mitarbeiterId: number): Promise<{ token: string; url: string }> {
    const ma = await this.prisma.mitarbeiter.findUnique({ where: { id: BigInt(mitarbeiterId) } });
    if (!ma) throw new NotFoundException(`Mitarbeiter ${mitarbeiterId} nicht gefunden`);
    const firma = await this.firmaLaden();
    const now = new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const stundenRows = await this.prisma.mitarbeiterStunden.findMany({
      where: { mitarbeiter_id: BigInt(mitarbeiterId) },
      orderBy: { datum: 'desc' },
    });

    const stunden = stundenRows.map(s => ({
      ...s, id: Number(s.id), mitarbeiter_id: Number(s.mitarbeiter_id),
      stunden: Number(s.stunden), lohn: Number(s.lohn), zuschlag: Number(s.zuschlag),
      gesamt: Number(s.lohn) + Number(s.zuschlag),
      datumFormatiert: this.datumFormatieren(s.datum.toISOString().slice(0, 10)),
    }));

    const gesamtStunden = stunden.reduce((s, r) => s + r.stunden, 0);
    const gesamtGrundlohn = stunden.reduce((s, r) => s + r.lohn, 0);
    const gesamtZuschlag = stunden.reduce((s, r) => s + r.zuschlag, 0);
    const gesamtLohn = gesamtGrundlohn + gesamtZuschlag;
    const bezahlt = stunden.filter(r => r.bezahlt).reduce((s, r) => s + r.gesamt, 0);
    const offen = gesamtLohn - bezahlt;

    const kontext = {
      firma, logoBase64: this.logoBase64, erstelltAm: now,
      mitarbeiter: { ...ma, id: Number(ma.id), stundenlohn: Number(ma.stundenlohn) },
      stundenlohnFormatiert: Number(ma.stundenlohn) > 0 ? this.fmtEur(Number(ma.stundenlohn)) : 'variabel',
      stunden, gesamtStunden, gesamtGrundlohn, gesamtZuschlag, gesamtLohn, bezahlt, offen,
      offerFarbe: offen > 0 ? 'red' : 'green',
    };

    const html = this.templateRendern('mitarbeiter-abrechnung.hbs', kontext);
    const pdf = await this.pdfAusHtmlErstellen(html);
    const filename = `Abrechnung_${ma.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

    await this.prisma.pdfArchive.create({
      data: {
        typ: 'mitarbeiter', referenz_nr: ma.name,
        referenz_id: ma.id, empf: ma.rolle ?? 'Mitarbeiter',
        titel: `Stundenabrechnung ${now}`, datum: new Date(), filename, html_body: html,
      },
    });

    return this.tokenErstellen(pdf, filename);
  }

  // ── Archiv ──────────────────────────────────────────────────────────────────
  async archivLaden() {
    const rows = await this.prisma.pdfArchive.findMany({
      select: { id: true, typ: true, referenz_nr: true, referenz_id: true, empf: true, titel: true, datum: true, filename: true, erstellt_am: true },
      orderBy: { erstellt_am: 'desc' },
      take: 200,
    });
    return rows.map(r => ({ ...r, id: Number(r.id), referenz_id: r.referenz_id ? Number(r.referenz_id) : null }));
  }

  async archivRegenerieren(id: number): Promise<Buffer> {
    const row = await this.prisma.pdfArchive.findUnique({ where: { id: BigInt(id) } });
    if (!row || !row.html_body) throw new NotFoundException('Kein HTML gespeichert — Regenerierung nicht möglich');
    return this.pdfAusHtmlErstellen(row.html_body);
  }

  async archivEintragLoeschen(id: number) {
    await this.prisma.pdfArchive.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }

  async archivBereinigen() {
    const grenze = new Date();
    grenze.setMonth(grenze.getMonth() - 12);
    const result = await this.prisma.pdfArchive.deleteMany({ where: { erstellt_am: { lt: grenze } } });
    return { ok: true, deleted: result.count };
  }

  cacheLeeren() {
    this.pdfCache.clear();
    return { ok: true };
  }

  // ── Token-Store ──────────────────────────────────────────────────────────────
  tokenAbrufen(token: string): PdfToken | null {
    const entry = this.tokenStore.get(token);
    if (!entry || entry.expires < Date.now()) { this.tokenStore.delete(token); return null; }
    return entry.data;
  }

  // ── Private Hilfsmethoden ────────────────────────────────────────────────────
  private async firmaLaden(): Promise<FirmaSettings> {
    const row = await this.prisma.settings.findUnique({ where: { key: 'firma' } });
    if (!row) return {};
    try { return JSON.parse(row.value) as FirmaSettings; } catch { return {}; }
  }

  private templateRendern(templateDatei: string, kontext: Record<string, unknown>): string {
    const templatePfad = path.join(this.TEMPLATE_DIR, templateDatei);
    const source = fs.readFileSync(templatePfad, 'utf-8');
    const template = Handlebars.compile(source);
    return template(kontext);
  }

  private partialRegistrieren(name: string, relativerPfad: string): void {
    const pfad = path.join(this.TEMPLATE_DIR, relativerPfad);
    try {
      const source = fs.readFileSync(pfad, 'utf-8');
      Handlebars.registerPartial(name, source);
    } catch (e) {
      this.logger.warn(`Partial '${name}' nicht gefunden: ${pfad}`);
    }
  }

  private async pdfAusHtmlErstellen(html: string): Promise<Buffer> {
    const cacheKey = crypto.createHash('md5').update(html).digest('hex');
    if (this.pdfCache.has(cacheKey)) return this.pdfCache.get(cacheKey)!;
    const pdf = await this.puppeteer.htmlZuPdf(html);
    if (this.pdfCache.size >= this.CACHE_MAX) this.pdfCache.delete(this.pdfCache.keys().next().value!);
    this.pdfCache.set(cacheKey, pdf);
    return pdf;
  }

  private tokenErstellen(pdf: Buffer, filename: string): { token: string; url: string } {
    const token = crypto.randomBytes(8).toString('hex');
    this.tokenStore.set(token, { data: { pdf, filename }, expires: Date.now() + 5 * 60 * 1000 });
    const safeFilename = encodeURIComponent(filename.replace(/[^\w\-äöüÄÖÜß.]/g, '_'));
    return { token, url: `/api/pdf/view/${token}/${safeFilename}` };
  }

  private abgelaufeneTokensLoeschen(): void {
    const now = Date.now();
    for (const [key, val] of this.tokenStore) {
      if (val.expires < now) this.tokenStore.delete(key);
    }
  }

  private datumFormatieren(s: string): string {
    if (!s) return '–';
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private addTage(datum: string, tage: number): string {
    if (!datum) return '–';
    const [y, m, d] = datum.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + tage);
    return dt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private fmtEur(n: number): string {
    return (n || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }
}
