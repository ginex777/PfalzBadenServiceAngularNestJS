import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PdfTokenService } from './pdf-token.service';
import { PdfRenderService } from './pdf-render.service';
import { RechnungPdfGenerator } from './generators/rechnung-pdf.generator';
import { AngebotPdfGenerator } from './generators/angebot-pdf.generator';
import { MahnungPdfGenerator } from './generators/mahnung-pdf.generator';
import { EuerPdfGenerator } from './generators/euer-pdf.generator';
import { HausmeisterPdfGenerator } from './generators/hausmeister-pdf.generator';
import { MitarbeiterPdfGenerator } from './generators/mitarbeiter-pdf.generator';
import { VertragPdfGenerator } from './generators/vertrag-pdf.generator';

@Injectable()
export class PdfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: PdfTokenService,
    private readonly renderService: PdfRenderService,
    private readonly rechnungGen: RechnungPdfGenerator,
    private readonly angebotGen: AngebotPdfGenerator,
    private readonly mahnungGen: MahnungPdfGenerator,
    private readonly euerGen: EuerPdfGenerator,
    private readonly hausmeisterGen: HausmeisterPdfGenerator,
    private readonly mitarbeiterGen: MitarbeiterPdfGenerator,
    private readonly vertragGen: VertragPdfGenerator,
  ) {}

  // ── PDF Generators ──────────────────────────────────────────────────────────
  rechnungPdfErstellen(id: number) { return this.rechnungGen.erstellen(id); }
  angebotPdfErstellen(id: number) { return this.angebotGen.erstellen(id); }
  mahnungPdfErstellen(id: number) { return this.mahnungGen.erstellen(id); }
  euerPdfErstellen(jahr: number, ergebnis: Record<string, unknown>) { return this.euerGen.erstellen(jahr, ergebnis); }
  hausmeisterEinsatzPdfErstellen(id: number) { return this.hausmeisterGen.einsatzPdfErstellen(id); }
  hausmeisterMonatsnachweisPdfErstellen(monat: string, mitarbeiterName?: string) { return this.hausmeisterGen.monatsnachweisPdfErstellen(monat, mitarbeiterName); }
  mitarbeiterAbrechnungPdfErstellen(id: number) { return this.mitarbeiterGen.abrechnungPdfErstellen(id); }
  vertragPdfErstellen(id: number) { return this.vertragGen.erstellen(id); }

  // ── Token ───────────────────────────────────────────────────────────────────
  tokenAbrufen(token: string) { return this.tokenService.tokenAbrufen(token); }

  // ── Archiv ──────────────────────────────────────────────────────────────────
  async archivLaden() {
    const rows = await this.prisma.pdfArchive.findMany({
      select: { id: true, typ: true, referenz_nr: true, referenz_id: true, empf: true, titel: true, datum: true, filename: true, erstellt_am: true },
      orderBy: { erstellt_am: 'desc' },
      take: 200,
    });
    return rows.map(r => ({ ...r, id: Number(r.id), referenz_id: r.referenz_id ? Number(r.referenz_id) : null }));
  }

  async archivRegenerieren(id: number): Promise<Buffer> {
    const row = await this.prisma.pdfArchive.findUnique({ where: { id: BigInt(id) } });
    if (!row?.html_body) throw new NotFoundException('Kein HTML gespeichert — Regenerierung nicht möglich');
    const firma = await this.renderService.firmaLaden();
    return this.renderService.pdfMitHeaderFooterErstellen(row.html_body, firma);
  }

  async archivEintragLoeschen(id: number) {
    await this.prisma.pdfArchive.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }

  async archivBereinigen() {
    const grenze = new Date();
    grenze.setMonth(grenze.getMonth() - 12);
    const result = await this.prisma.pdfArchive.deleteMany({ where: { erstellt_am: { lt: grenze } } });
    return { ok: true, deleted: result.count };
  }

  cacheLeeren() { return this.renderService.cacheLeeren(); }
}
