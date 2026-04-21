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
  createRechnungPdf(id: number) {
    return this.rechnungGen.create(id);
  }
  createAngebotPdf(id: number) {
    return this.angebotGen.create(id);
  }
  createMahnungPdf(id: number) {
    return this.mahnungGen.create(id);
  }
  createEuerPdf(jahr: number, ergebnis: Record<string, unknown>) {
    return this.euerGen.create(jahr, ergebnis);
  }
  createHausmeisterEinsatzPdf(id: number) {
    return this.hausmeisterGen.createEinsatzPdf(id);
  }
  createHausmeisterMonatsnachweisPdf(monat: string, mitarbeiterName?: string) {
    return this.hausmeisterGen.createMonatsnachweisPdf(monat, mitarbeiterName);
  }
  createMitarbeiterAbrechnungPdf(id: number) {
    return this.mitarbeiterGen.createAbrechnungPdf(id);
  }
  createVertragPdf(id: number) {
    return this.vertragGen.create(id);
  }

  // ── Token ───────────────────────────────────────────────────────────────────
  getToken(token: string) {
    return this.tokenService.getToken(token);
  }

  // ── Archiv ──────────────────────────────────────────────────────────────────
  async getArchive() {
    const rows = await this.prisma.pdfArchive.findMany({
      select: {
        id: true,
        typ: true,
        referenz_nr: true,
        referenz_id: true,
        empf: true,
        titel: true,
        datum: true,
        filename: true,
        erstellt_am: true,
      },
      orderBy: { erstellt_am: 'desc' },
      take: 200,
    });
    return rows.map((r) => ({
      ...r,
      id: Number(r.id),
      referenz_id: r.referenz_id ? Number(r.referenz_id) : null,
    }));
  }

  async regenerateArchive(id: number): Promise<Buffer> {
    const row = await this.prisma.pdfArchive.findUnique({
      where: { id: BigInt(id) },
    });
    if (!row?.html_body)
      throw new NotFoundException(
        'Kein HTML gespeichert — Regenerierung nicht möglich',
      );
    const firma = await this.renderService.loadFirma();
    return this.renderService.createPdfWithHeaderFooter(row.html_body, firma);
  }

  async deleteArchiveEntry(id: number) {
    await this.prisma.pdfArchive.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }

  async cleanArchive() {
    const grenze = new Date();
    grenze.setMonth(grenze.getMonth() - 12);
    const result = await this.prisma.pdfArchive.deleteMany({
      where: { erstellt_am: { lt: grenze } },
    });
    return { ok: true, deleted: result.count };
  }

  clearCache() {
    return this.renderService.clearCache();
  }
}
