import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';
import { PdfTokenService } from './pdf-token.service';
import { PdfRenderService } from './pdf-render.service';
import { PrismaService } from '../../core/database/prisma.service';
import { PuppeteerService } from './puppeteer.service';
import { RechnungPdfGenerator } from './generators/rechnung-pdf.generator';
import { AngebotPdfGenerator } from './generators/angebot-pdf.generator';
import { MahnungPdfGenerator } from './generators/mahnung-pdf.generator';
import { EuerPdfGenerator } from './generators/euer-pdf.generator';
import { HausmeisterPdfGenerator } from './generators/hausmeister-pdf.generator';
import { MitarbeiterPdfGenerator } from './generators/mitarbeiter-pdf.generator';
import { VertragPdfGenerator } from './generators/vertrag-pdf.generator';

const mockPrisma = {
  settings: { findUnique: jest.fn() },
  pdfArchive: { findMany: jest.fn() },
};
const mockPuppeteer = { htmlZuPdf: jest.fn() };

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfService,
        PdfTokenService,
        PdfRenderService,
        RechnungPdfGenerator,
        AngebotPdfGenerator,
        MahnungPdfGenerator,
        EuerPdfGenerator,
        HausmeisterPdfGenerator,
        MitarbeiterPdfGenerator,
        VertragPdfGenerator,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PuppeteerService, useValue: mockPuppeteer },
      ],
    }).compile();

    service = module.get<PdfService>(PdfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
