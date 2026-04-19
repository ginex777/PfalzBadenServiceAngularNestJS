import { Injectable, NotFoundException } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { PrismaService } from '../../../core/database/prisma.service';
import { PdfRenderService } from '../pdf-render.service';
import { PdfTokenService } from '../pdf-token.service';

@Injectable()
export class AngebotPdfGenerator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly render: PdfRenderService,
    private readonly token: PdfTokenService,
  ) {}

  async erstellen(angebotId: number): Promise<{ token: string; url: string }> {
    const angebot = await this.prisma.angebote.findUnique({ where: { id: BigInt(angebotId) } });
    if (!angebot) throw new NotFoundException(`Angebot ${angebotId} nicht gefunden`);
    const firma = await this.render.firmaLaden();

    const positionen = (angebot.positionen as { bez: string; stunden?: string; einzelpreis?: number; gesamtpreis: number }[]) ?? [];
    const netto = positionen.reduce((s, p) => s + (Number(p.gesamtpreis) || 0), 0);
    const ust = netto * 0.19;
    const brutto = netto + ust;
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

    const kontext = {
      firma, logoBase64: this.render.logoBase64,
      angebot: {
        ...angebot,
        id: Number(angebot.id),
        kunden_id: angebot.kunden_id ? Number(angebot.kunden_id) : null,
        brutto: Number(angebot.brutto),
        positionen,
        datumFormatiert: angebot.datum ? this.render.datumFormatieren(angebot.datum.toISOString().slice(0, 10)) : '–',
        gueltigBisFormatiert: angebot.gueltig_bis ? this.render.datumFormatieren(angebot.gueltig_bis.toISOString().slice(0, 10)) : '30 Tage',
        nettoFormatiert: this.render.fmtEur(netto),
        ustFormatiert: this.render.fmtEur(ust),
        bruttoFormatiert: this.render.fmtEur(brutto),
        zusatzHtml: angebot.zusatz ? new Handlebars.SafeString(esc(angebot.zusatz)) : null,
      },
    };

    const html = this.render.templateRendern('angebot.hbs', kontext);
    const pdf = await this.render.pdfMitHeaderFooterErstellen(html, firma);
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

    return this.token.tokenErstellen(pdf, filename);
  }
}
