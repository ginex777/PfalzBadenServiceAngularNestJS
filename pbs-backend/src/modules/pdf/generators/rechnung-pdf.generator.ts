import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../../core/database/prisma.service';
import type { PdfRenderService } from '../pdf-render.service';
import type { PdfTokenService } from '../pdf-token.service';

@Injectable()
export class RechnungPdfGenerator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly render: PdfRenderService,
    private readonly token: PdfTokenService,
  ) {}

  async create(rechnungId: number): Promise<{ token: string; url: string }> {
    const rechnung = await this.prisma.rechnungen.findUnique({
      where: { id: BigInt(rechnungId) },
    });
    if (!rechnung)
      throw new NotFoundException(`Rechnung ${rechnungId} nicht gefunden`);
    const firma = await this.render.loadFirma();

    const positionen =
      (rechnung.positionen as Array<{
        bez: string;
        stunden?: string;
        einzelpreis?: number;
        gesamtpreis: number;
      }>) ?? [];
    const mwstSatz = Number(rechnung.mwst_satz ?? 19);
    const netto = positionen.reduce(
      (s, p) => s + (Number(p.gesamtpreis) || 0),
      0,
    );
    const ust = netto * (mwstSatz / 100);
    const brutto = netto + ust;

    const datumStr = rechnung.datum
      ? this.render.formatDate(rechnung.datum.toISOString().slice(0, 10))
      : '–';
    const zahlDatum = rechnung.datum
      ? this.render.addDays(
          rechnung.datum.toISOString().slice(0, 10),
          rechnung.zahlungsziel ?? 14,
        )
      : '–';

    const kontext = {
      firma,
      logoBase64: this.render.logoBase64,
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
        nettoFormatiert: this.render.formatEuro(netto),
        ustFormatiert: this.render.formatEuro(ust),
        bruttoFormatiert: this.render.formatEuro(brutto),
      },
    };

    const html = this.render.renderTemplate('rechnung.hbs', kontext);
    const pdf = await this.render.createPdfWithHeaderFooter(html, firma);
    const filename = `Rechnung_${rechnung.nr}.pdf`;

    await this.prisma.pdfArchive.create({
      data: {
        typ: 'rechnung',
        referenz_nr: rechnung.nr,
        referenz_id: rechnung.id,
        empf: rechnung.empf,
        titel: rechnung.titel ?? null,
        datum: rechnung.datum ?? null,
        filename,
        html_body: html,
      },
    });

    return this.token.createToken(pdf, filename);
  }
}
