import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { PdfRenderService } from '../pdf-render.service';
import { PdfTokenService } from '../pdf-token.service';

const MAHNUNG_TEXTE: Record<number, string> = {
  1: 'Wir möchten Sie freundlich daran erinnern, dass die oben genannte Rechnung noch nicht beglichen wurde.',
  2: 'Trotz unserer ersten Mahnung ist die Rechnung noch immer nicht bezahlt. Wir bitten Sie dringend um Begleichung.',
  3: 'Dies ist unsere letzte Mahnung. Sollten Sie nicht innerhalb von 7 Tagen zahlen, werden wir rechtliche Schritte einleiten.',
};

@Injectable()
export class MahnungPdfGenerator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly render: PdfRenderService,
    private readonly token: PdfTokenService,
  ) {}

  async erstellen(mahnungId: number): Promise<{ token: string; url: string }> {
    const mahnung = await this.prisma.mahnungen.findUnique({
      where: { id: BigInt(mahnungId) },
      include: { rechnung: true },
    });
    if (!mahnung) throw new NotFoundException(`Mahnung ${mahnungId} nicht gefunden`);

    const rechnung = mahnung.rechnung;
    const firma = await this.render.firmaLaden();

    const positionen = (rechnung.positionen as { bez: string; stunden?: string; einzelpreis?: number; gesamtpreis: number }[]) ?? [];
    const mwstSatz = Number(rechnung.mwst_satz ?? 19);
    const netto = positionen.reduce((s, p) => s + (Number(p.gesamtpreis) || 0), 0);
    const ust = netto * (mwstSatz / 100);
    const brutto = netto + ust;
    const gebuehr = Number(mahnung.betrag_gebuehr);
    const gesamtbetrag = brutto + gebuehr;

    const datumStr = rechnung.datum ? this.render.datumFormatieren(rechnung.datum.toISOString().slice(0, 10)) : '–';
    const mahnungDatumStr = this.render.datumFormatieren(mahnung.datum.toISOString().slice(0, 10));
    const zahlDatum = rechnung.datum ? this.render.addTage(rechnung.datum.toISOString().slice(0, 10), (rechnung.zahlungsziel ?? 14) + 14) : '–';

    const kontext = {
      firma, logoBase64: this.render.logoBase64,
      mahnung: {
        ...mahnung,
        id: Number(mahnung.id),
        rechnung_id: Number(mahnung.rechnung_id),
        betrag_gebuehr: gebuehr,
        datumFormatiert: mahnungDatumStr,
        stufeText: `${mahnung.stufe}. Mahnung`,
        mahntext: MAHNUNG_TEXTE[mahnung.stufe] ?? MAHNUNG_TEXTE[3],
      },
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
        nettoFormatiert: this.render.fmtEur(netto),
        ustFormatiert: this.render.fmtEur(ust),
        bruttoFormatiert: this.render.fmtEur(brutto),
      },
      gebuehrFormatiert: this.render.fmtEur(gebuehr),
      gesamtbetragFormatiert: this.render.fmtEur(gesamtbetrag),
    };

    const html = this.render.templateRendern('mahnung.hbs', kontext);
    const pdf = await this.render.pdfMitHeaderFooterErstellen(html, firma);
    const filename = `Mahnung_${mahnung.stufe}_${rechnung.nr}.pdf`;

    await this.prisma.pdfArchive.create({
      data: {
        typ: 'mahnung', referenz_nr: `${mahnung.stufe}. Mahnung zu ${rechnung.nr}`,
        referenz_id: mahnung.id, empf: rechnung.empf,
        titel: `${mahnung.stufe}. Mahnung`,
        datum: mahnung.datum,
        filename, html_body: html,
      },
    });

    return this.token.tokenErstellen(pdf, filename);
  }
}
