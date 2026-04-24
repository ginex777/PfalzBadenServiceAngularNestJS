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
import { ChecklistePdfGenerator } from './generators/checkliste-pdf.generator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

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
    private readonly checklisteGen: ChecklistePdfGenerator,
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
  createEuerPdf(jahr: number, ergebnis: object) {
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
  createChecklisteSubmissionPdf(
    submissionId: number,
    auth: { role: string; employeeId: number | null },
  ) {
    return this.checklisteGen.createSubmissionPdf(submissionId, auth);
  }

  // ── Token ───────────────────────────────────────────────────────────────────
  getToken(token: string) {
    return this.tokenService.getToken(token);
  }

  // ── Archiv ──────────────────────────────────────────────────────────────────
  async getArchive(
    pagination: PaginationDto,
    filter?: { q?: string; typ?: string },
  ): Promise<
    PaginatedResponse<{
      id: number;
      typ: string;
      referenz_nr: string;
      referenz_id: number | null;
      empf: string | null;
      titel: string | null;
      datum: Date | null;
      filename: string;
      erstellt_am: Date;
    }>
  > {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const q = filter?.q?.trim();
    const typ = filter?.typ?.trim();
    const where =
      q || typ
        ? {
            AND: [
              typ ? { typ } : {},
              q
                ? {
                    OR: [
                      {
                        referenz_nr: {
                          contains: q,
                          mode: 'insensitive' as const,
                        },
                      },
                      { empf: { contains: q, mode: 'insensitive' as const } },
                      { titel: { contains: q, mode: 'insensitive' as const } },
                      {
                        filename: { contains: q, mode: 'insensitive' as const },
                      },
                    ],
                  }
                : {},
            ],
          }
        : undefined;

    const select = {
      id: true,
      typ: true,
      referenz_nr: true,
      referenz_id: true,
      empf: true,
      titel: true,
      datum: true,
      filename: true,
      erstellt_am: true,
    } as const;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.pdfArchive.findMany({
        where,
        select,
        orderBy: { erstellt_am: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.pdfArchive.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        ...r,
        id: Number(r.id),
        referenz_id: r.referenz_id ? Number(r.referenz_id) : null,
      })),
      total,
      page,
      pageSize,
    };
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
