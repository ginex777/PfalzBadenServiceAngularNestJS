import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PuppeteerService } from './puppeteer.service';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface FirmaSettings {
  firma?: string; zusatz?: string; strasse?: string; ort?: string;
  steuernr?: string; ustId?: string; gf?: string; tel?: string;
  email?: string; bank?: string; iban?: string; bic?: string;
}

// Handlebars helpers — registered once at module load
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

@Injectable()
export class PdfRenderService {
  private readonly logger = new Logger(PdfRenderService.name);
  private readonly pdfCache = new Map<string, Buffer>();
  private readonly CACHE_MAX = 30;
  private readonly TEMPLATE_DIR = path.join(__dirname, 'templates');
  readonly logoBase64: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly puppeteer: PuppeteerService,
  ) {
    const logoTxtPath = path.join(__dirname, 'logo-base64.txt');
    try {
      this.logoBase64 = fs.readFileSync(logoTxtPath, 'utf-8').trim();
    } catch {
      this.logoBase64 = '';
      this.logger.warn('Logo-Base64 nicht gefunden: ' + logoTxtPath);
    }
    this.partialRegistrieren('header', 'partials/header.hbs');
    this.partialRegistrieren('footer', 'partials/footer.hbs');
  }

  async firmaLaden(): Promise<FirmaSettings> {
    const row = await this.prisma.settings.findUnique({ where: { key: 'firma' } });
    if (!row) return {};
    try { return JSON.parse(row.value) as FirmaSettings; } catch { return {}; }
  }

  templateRendern(templateDatei: string, kontext: Record<string, unknown>): string {
    const templatePfad = path.join(this.TEMPLATE_DIR, templateDatei);
    const source = fs.readFileSync(templatePfad, 'utf-8');
    const template = Handlebars.compile(source);
    return template(kontext);
  }

  async pdfAusHtmlErstellen(html: string): Promise<Buffer> {
    const cacheKey = crypto.createHash('md5').update(html).digest('hex');
    if (this.pdfCache.has(cacheKey)) return this.pdfCache.get(cacheKey)!;
    const pdf = await this.puppeteer.htmlZuPdf(html);
    if (this.pdfCache.size >= this.CACHE_MAX) this.pdfCache.delete(this.pdfCache.keys().next().value!);
    this.pdfCache.set(cacheKey, pdf);
    return pdf;
  }

  async pdfMitHeaderFooterErstellen(html: string, firma: FirmaSettings): Promise<Buffer> {
    const enriched = this.headerFooterEinbauen(html, firma);
    const cacheKey = crypto.createHash('md5').update(enriched).digest('hex');
    if (this.pdfCache.has(cacheKey)) return this.pdfCache.get(cacheKey)!;
    // No Puppeteer native headers — CSS position:fixed handles them on every page
    const pdf = await this.puppeteer.htmlZuPdf(enriched);
    if (this.pdfCache.size >= this.CACHE_MAX) this.pdfCache.delete(this.pdfCache.keys().next().value!);
    this.pdfCache.set(cacheKey, pdf);
    return pdf;
  }

  private headerFooterEinbauen(html: string, firma: FirmaSettings): string {
    const e = (s?: string) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const logo = this.logoBase64
      ? `<img src="data:image/svg+xml;base64,${this.logoBase64}" style="max-height:46px;max-width:130px;object-fit:contain;display:block;" alt="Logo">`
      : '';

    const headerHtml = `
<div class="pbshf-header">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:7mm 20mm 3mm;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
    <div>
      <div style="font-size:13px;font-weight:700;color:#111;font-family:Arial,Helvetica,sans-serif;">${e(firma.firma)}</div>
      ${firma.zusatz ? `<div style="font-size:9px;color:#555;margin-top:2px;font-family:Arial,Helvetica,sans-serif;">${e(firma.zusatz)}</div>` : ''}
      <div style="font-size:9px;color:#555;margin-top:2px;font-family:Arial,Helvetica,sans-serif;">${e(firma.strasse)} · ${e(firma.ort)}</div>
    </div>
    ${logo}
  </div>
  <div style="border-top:0.75px solid #555;margin:0 20mm;"></div>
</div>`;

    const footerHtml = `
<div class="pbshf-footer">
  <div style="border-top:0.75px solid #aaa;margin:3mm 20mm 2mm;"></div>
  <div style="display:flex;justify-content:space-between;gap:12px;padding:0 20mm 4mm;font-family:Arial,Helvetica,sans-serif;font-size:7.5px;color:#444;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
    <div style="flex:1;">
      <div><strong>${e(firma.zusatz || firma.firma)}</strong></div>
      <div>${e(firma.strasse)}, ${e(firma.ort)}</div>
      ${firma.steuernr ? `<div>Steuernummer: ${e(firma.steuernr)}</div>` : ''}
      ${firma.ustId ? `<div>USt-IdNr.: ${e(firma.ustId)}</div>` : ''}
    </div>
    <div style="flex:1;">
      <div style="font-weight:700;">Kontakt</div>
      ${firma.tel ? `<div>Tel. ${e(firma.tel)}</div>` : ''}
      ${firma.email ? `<div>${e(firma.email)}</div>` : ''}
    </div>
    <div style="flex:1;">
      <div style="font-weight:700;">Bankverbindung</div>
      ${firma.bank ? `<div>${e(firma.bank)}</div>` : ''}
      ${firma.iban ? `<div>IBAN: ${e(firma.iban)}</div>` : ''}
      ${firma.bic ? `<div>BIC: ${e(firma.bic)}</div>` : ''}
    </div>
  </div>
</div>`;

    const css = `
<style>
  /* Override @page to reserve margin space for fixed header/footer */
  @page { size: A4; margin-top: 36mm; margin-bottom: 30mm; margin-left: 0; margin-right: 0; }
  .pbshf-header {
    position: fixed; top: 0; left: 0; right: 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .pbshf-footer {
    position: fixed; bottom: 0; left: 0; right: 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
</style>`;

    return html
      .replace('</head>', `${css}\n</head>`)
      .replace('</body>', `${headerHtml}\n${footerHtml}\n</body>`);
  }

  cacheLeeren(): { ok: true } {
    this.pdfCache.clear();
    return { ok: true };
  }

  datumFormatieren(s: string): string {
    if (!s) return '–';
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  addTage(datum: string, tage: number): string {
    if (!datum) return '–';
    const [y, m, d] = datum.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + tage);
    return dt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  fmtEur(n: number): string {
    return (n || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }

  private partialRegistrieren(name: string, relativerPfad: string): void {
    const pfad = path.join(this.TEMPLATE_DIR, relativerPfad);
    try {
      const source = fs.readFileSync(pfad, 'utf-8');
      Handlebars.registerPartial(name, source);
    } catch {
      this.logger.warn(`Partial '${name}' nicht gefunden: ${pfad}`);
    }
  }
}
