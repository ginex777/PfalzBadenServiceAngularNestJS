import { Injectable, NotFoundException } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import type { PrismaService } from '../../../core/database/prisma.service';
import type { PdfRenderService } from '../pdf-render.service';
import type { PdfTokenService } from '../pdf-token.service';

@Injectable()
export class AngebotPdfGenerator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly render: PdfRenderService,
    private readonly token: PdfTokenService,
  ) {}

  async create(angebotId: number): Promise<{ token: string; url: string }> {
    const angebot = await this.prisma.angebote.findUnique({
      where: { id: BigInt(angebotId) },
    });
    if (!angebot)
      throw new NotFoundException(`Angebot ${angebotId} nicht gefunden`);
    const firma = await this.render.loadFirma();

    const positionen =
      (angebot.positionen as Array<{
        bez: string;
        stunden?: string;
        einzelpreis?: number;
        gesamtpreis: number;
      }>) ?? [];
    const netto = positionen.reduce(
      (s, p) => s + (Number(p.gesamtpreis) || 0),
      0,
    );
    const ust = netto * 0.19;
    const brutto = netto + ust;
    const esc = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');

    const kontext = {
      firma,
      logoBase64: this.render.logoBase64,
      angebot: {
        ...angebot,
        id: Number(angebot.id),
        kunden_id: angebot.kunden_id ? Number(angebot.kunden_id) : null,
        brutto: Number(angebot.brutto),
        positionen,
        datumFormatiert: angebot.datum
          ? this.render.formatDate(angebot.datum.toISOString().slice(0, 10))
          : '–',
        gueltigBisFormatiert: angebot.gueltig_bis
          ? this.render.formatDate(
              angebot.gueltig_bis.toISOString().slice(0, 10),
            )
          : '30 Tage',
        nettoFormatiert: this.render.formatEuro(netto),
        ustFormatiert: this.render.formatEuro(ust),
        bruttoFormatiert: this.render.formatEuro(brutto),
        zusatzHtml: angebot.zusatz
          ? new Handlebars.SafeString(esc(angebot.zusatz))
          : null,
      },
    };

    const html = this.render.renderTemplate('angebot.hbs', kontext);
    const pdf = await this.render.createPdfWithHeaderFooter(html, firma);
    const filename = `Angebot_${angebot.nr}.pdf`;

    await this.prisma.pdfArchive.create({
      data: {
        typ: 'angebot',
        referenz_nr: angebot.nr,
        referenz_id: angebot.id,
        empf: angebot.empf,
        titel: angebot.titel ?? null,
        datum: angebot.datum ?? null,
        filename,
        html_body: html,
      },
    });

    return this.token.createToken(pdf, filename);
  }
}
