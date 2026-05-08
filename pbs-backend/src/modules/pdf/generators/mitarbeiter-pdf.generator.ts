import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { PdfRenderService } from '../pdf-render.service';
import { PdfTokenService } from '../pdf-token.service';

@Injectable()
export class MitarbeiterPdfGenerator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly render: PdfRenderService,
    private readonly token: PdfTokenService,
  ) {}

  async createAbrechnungPdf(
    mitarbeiterId: number,
  ): Promise<{ token: string; url: string }> {
    const ma = await this.prisma.mitarbeiter.findUnique({
      where: { id: BigInt(mitarbeiterId) },
    });
    if (!ma)
      throw new NotFoundException(
        `Mitarbeiter ${mitarbeiterId} nicht gefunden`,
      );
    const firma = await this.render.loadFirma();
    const now = new Date().toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const stundenRows = await this.prisma.mitarbeiterStunden.findMany({
      where: { mitarbeiter_id: BigInt(mitarbeiterId) },
      orderBy: { datum: 'desc' },
    });

    const stunden = stundenRows.map((s) => ({
      ...s,
      id: Number(s.id),
      mitarbeiter_id: Number(s.mitarbeiter_id),
      stunden: Number(s.stunden),
      lohn: Number(s.lohn),
      zuschlag: Number(s.zuschlag),
      gesamt: Number(s.lohn) + Number(s.zuschlag),
      datumFormatiert: this.render.formatDate(
        s.datum.toISOString().slice(0, 10),
      ),
    }));

    const gesamtStunden = stunden.reduce((s, r) => s + r.stunden, 0);
    const gesamtGrundlohn = stunden.reduce((s, r) => s + r.lohn, 0);
    const gesamtZuschlag = stunden.reduce((s, r) => s + r.zuschlag, 0);
    const gesamtLohn = gesamtGrundlohn + gesamtZuschlag;
    const bezahlt = stunden
      .filter((r) => r.bezahlt)
      .reduce((s, r) => s + r.gesamt, 0);
    const offen = gesamtLohn - bezahlt;

    const kontext = {
      firma,
      logoBase64: this.render.logoBase64,
      erstelltAm: now,
      mitarbeiter: {
        ...ma,
        id: Number(ma.id),
        stundenlohn: Number(ma.stundenlohn),
      },
      stundenlohnFormatiert:
        Number(ma.stundenlohn) > 0
          ? this.render.formatEuro(Number(ma.stundenlohn))
          : 'variabel',
      stunden,
      gesamtStunden,
      gesamtGrundlohn,
      gesamtZuschlag,
      gesamtLohn,
      bezahlt,
      offen,
      offerFarbe: offen > 0 ? 'red' : 'green',
    };

    const html = this.render.renderTemplate(
      'mitarbeiter-abrechnung.hbs',
      kontext,
    );
    const pdf = await this.render.createPdfWithHeaderFooter(html, firma);
    const filename = `Abrechnung_${ma.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

    await this.prisma.pdfArchive.create({
      data: {
        typ: 'mitarbeiter',
        referenz_nr: ma.name,
        referenz_id: ma.id,
        empf: ma.rolle ?? 'Mitarbeiter',
        titel: `Stundenabrechnung ${now}`,
        datum: new Date(),
        filename,
        html_body: html,
      },
    });

    return this.token.createToken(pdf, filename);
  }
}
