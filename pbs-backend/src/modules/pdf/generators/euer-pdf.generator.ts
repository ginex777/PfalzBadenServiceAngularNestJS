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

  async create(
    jahr: number,
    ergebnis: object,
  ): Promise<{ token: string; url: string }> {
    const firma = await this.render.loadFirma();
    const now = new Date().toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const kontext = {
      firma,
      logoBase64: this.render.logoBase64,
      jahr,
      erstelltAm: now,
      ...ergebnis,
    };
    const html = this.render.renderTemplate('euer.hbs', kontext);
    const pdf = await this.render.createPdfFromHtml(html);
    const filename = `EÜR_${jahr}.pdf`;

    await this.prisma.pdfArchive.create({
      data: {
        typ: 'euer',
        referenz_nr: String(jahr),
        filename,
        html_body: html,
      },
    });

    return this.token.createToken(pdf, filename);
  }
}
