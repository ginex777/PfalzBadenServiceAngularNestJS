import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { PdfRenderService } from '../pdf-render.service';
import { PdfTokenService } from '../pdf-token.service';

@Injectable()
export class EuerPdfGenerator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly render: PdfRenderService,
    private readonly token: PdfTokenService,
  ) {}

  async erstellen(jahr: number, ergebnis: Record<string, unknown>): Promise<{ token: string; url: string }> {
    const firma = await this.render.firmaLaden();
    const now = new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const kontext = { firma, logoBase64: this.render.logoBase64, jahr, erstelltAm: now, ...ergebnis };
    const html = this.render.templateRendern('euer.hbs', kontext);
    const pdf = await this.render.pdfAusHtmlErstellen(html);
    const filename = `EÜR_${jahr}.pdf`;

    await this.prisma.pdfArchive.create({
      data: { typ: 'euer', referenz_nr: String(jahr), filename, html_body: html },
    });

    return this.token.tokenErstellen(pdf, filename);
  }
}
