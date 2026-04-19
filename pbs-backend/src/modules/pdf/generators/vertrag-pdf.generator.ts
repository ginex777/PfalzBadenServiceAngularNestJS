import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { PdfRenderService } from '../pdf-render.service';
import { PdfTokenService } from '../pdf-token.service';

@Injectable()
export class VertragPdfGenerator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly render: PdfRenderService,
    private readonly token: PdfTokenService,
  ) {}

  async erstellen(vertragId: number): Promise<{ token: string; url: string }> {
    const vertrag = await this.prisma.vertraege.findUnique({ where: { id: BigInt(vertragId) } });
    if (!vertrag) throw new NotFoundException(`Vertrag ${vertragId} nicht gefunden`);
    const firma = await this.render.firmaLaden();

    const erstelltAmFormatiert = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const kontext = {
      firma, logoBase64: this.render.logoBase64,
      vertrag: {
        ...vertrag,
        id: Number(vertrag.id),
        kunden_id: vertrag.kunden_id ? Number(vertrag.kunden_id) : null,
        monatliche_rate: Number(vertrag.monatliche_rate),
        rateFormatiert: this.render.fmtEur(Number(vertrag.monatliche_rate)),
        vertragsbeginnFormatiert: this.render.datumFormatieren(vertrag.vertragsbeginn.toISOString().slice(0, 10)),
        erstelltAmFormatiert,
      },
    };

    const html = this.render.templateRendern('vertrag.hbs', kontext);
    const pdf = await this.render.pdfMitHeaderFooterErstellen(html, firma);
    const filename = `Vertrag_${vertrag.id}_${vertrag.kunden_name.replace(/\s+/g, '_')}.pdf`;

    await this.prisma.vertraege.update({
      where: { id: BigInt(vertragId) },
      data: { pdf_filename: filename, html_body: html },
    });

    await this.prisma.pdfArchive.create({
      data: {
        typ: 'vertrag',
        referenz_nr: String(vertrag.id),
        referenz_id: vertrag.id,
        empf: vertrag.kunden_name,
        titel: vertrag.titel,
        datum: vertrag.vertragsbeginn,
        filename,
        html_body: html,
      },
    });

    return this.token.tokenErstellen(pdf, filename);
  }
}
