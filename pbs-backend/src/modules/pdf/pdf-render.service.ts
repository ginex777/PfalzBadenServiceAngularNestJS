import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PuppeteerService } from './puppeteer.service';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface FirmaSettings {
  firma?: string;
  zusatz?: string;
  strasse?: string;
  ort?: string;
  steuernr?: string;
  ustId?: string;
  gf?: string;
  tel?: string;
  email?: string;
  bank?: string;
  iban?: string;
  bic?: string;
}

// Handlebars helpers — registered once at module load
Handlebars.registerHelper(
  'fmtEur',
  (n: number) =>
    (n || 0).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' â‚¬',
);
Handlebars.registerHelper('posNr', (idx: number) => idx + 1);
Handlebars.registerHelper('fmtStunden', (n: number) =>
  (n || 0).toLocaleString('de-DE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }),
);
Handlebars.registerHelper('bezHtml', (bez: string) => {
  if (!bez) return '';
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = bez.split('\n');
  let html = '',
    inList = false,
    firstLine = true;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('- ')) {
      if (!inList) {
        html += '<ul class="bez-list">';
        inList = true;
      }
      html += `<li>${esc(t.slice(2))}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      if (t) {
        html += firstLine
          ? `<div><strong>${esc(t)}</strong></div>`
          : `<div>${esc(t)}</div>`;
        firstLine = false;
      } else html += '<div style="height:4px"></div>';
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
    this.registerPartial('header', 'partials/header.hbs');
    this.registerPartial('footer', 'partials/footer.hbs');
  }

  async loadFirma(): Promise<FirmaSettings> {
    const row = await this.prisma.settings.findUnique({
      where: { key: 'firma' },
    });
    if (!row) return {};
    try {
      return JSON.parse(row.value) as FirmaSettings;
    } catch {
      return {};
    }
  }

  renderTemplate(
    templateFile: string,
    context: Record<string, unknown>,
  ): string {
    const templatePath = path.join(this.TEMPLATE_DIR, templateFile);
    const source = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(source);
    return template(context);
  }

  async createPdfFromHtml(html: string): Promise<Buffer> {
    const cacheKey = crypto.createHash('md5').update(html).digest('hex');
    if (this.pdfCache.has(cacheKey)) return this.pdfCache.get(cacheKey)!;
    const pdf = await this.puppeteer.htmlZuPdf(html);
    if (this.pdfCache.size >= this.CACHE_MAX)
      this.pdfCache.delete(this.pdfCache.keys().next().value);
    this.pdfCache.set(cacheKey, pdf);
    return pdf;
  }

  async createPdfWithHeaderFooter(
    html: string,
    firma: FirmaSettings,
  ): Promise<Buffer> {
    const { headerTemplate, footerTemplate } =
      this.buildHeaderFooterTemplates(firma);
    const cacheKey = crypto
      .createHash('md5')
      .update(html + headerTemplate + footerTemplate)
      .digest('hex');
    if (this.pdfCache.has(cacheKey)) return this.pdfCache.get(cacheKey)!;

    // Native header/footer: reserves margin space (no overlap) and paginates correctly.
    const pdf = await this.puppeteer.htmlZuPdf(html, {
      headerTemplate,
      footerTemplate,
    });

    if (this.pdfCache.size >= this.CACHE_MAX)
      this.pdfCache.delete(this.pdfCache.keys().next().value);
    this.pdfCache.set(cacheKey, pdf);
    return pdf;
  }

  clearCache(): { ok: true } {
    this.pdfCache.clear();
    return { ok: true };
  }

  formatDate(s: string): string {
    if (!s) return 'â€“';
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    return new Date(s).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  addDays(date: string, days: number): string {
    if (!date) return 'â€“';
    const [y, m, d] = date.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    return dt.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatEuro(n: number): string {
    return (
      (n || 0).toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + ' â‚¬'
    );
  }

  private buildHeaderFooterTemplates(firma: FirmaSettings): {
    headerTemplate: string;
    footerTemplate: string;
  } {
    const ctx = { firma, logoBase64: this.logoBase64 };

    // header/footer templates do NOT inherit the page's <style>, so they must be self-styled.
    const headerCss = `
<style>
  * { box-sizing: border-box; }
  .doc-header { font-family: Arial,Helvetica,sans-serif; color: #111; width: 100%; padding: 6mm 20mm 0; }
  .firma-info { display: flex; flex-direction: column; gap: 1px; }
  .firma-name { font-size: 13px; font-weight: 700; }
  .firma-sub { font-size: 8px; color: #555; }
  .logo { max-height: 46px; max-width: 130px; object-fit: contain; }
  .header-rule { border: 0; border-top: 0.75px solid #555; margin: 2mm 20mm 0; }
</style>`;

    const footerCss = `
<style>
  * { box-sizing: border-box; }
  .doc-footer { font-family: Arial,Helvetica,sans-serif; font-size: 7.5px; color: #444; width: 100%; padding: 0 20mm 4mm; display: flex; justify-content: space-between; gap: 12px; line-height: 1.55; }
  .footer-section-label { font-weight: 700; }
</style>`;

    const headerTemplate = headerCss + Handlebars.compile('{{> header}}')(ctx);
    const footerTemplate =
      footerCss +
      `<div style="border-top:0.75px solid #aaa; margin: 0 20mm 2mm;"></div>` +
      Handlebars.compile('{{> footer}}')(ctx);

    return { headerTemplate, footerTemplate };
  }

  private registerPartial(name: string, relativePath: string): void {
    const pfad = path.join(this.TEMPLATE_DIR, relativePath);
    try {
      const source = fs.readFileSync(pfad, 'utf-8');
      Handlebars.registerPartial(name, source);
    } catch {
      this.logger.warn(`Partial '${name}' nicht gefunden: ${pfad}`);
    }
  }
}
