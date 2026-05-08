import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfTokenService } from './pdf-token.service';
import { PdfRenderService } from './pdf-render.service';
import { PrismaService } from '../../core/database/prisma.service';
import { RechnungPdfGenerator } from './generators/rechnung-pdf.generator';
import { AngebotPdfGenerator } from './generators/angebot-pdf.generator';
import { MahnungPdfGenerator } from './generators/mahnung-pdf.generator';
import { EuerPdfGenerator } from './generators/euer-pdf.generator';
import { HausmeisterPdfGenerator } from './generators/hausmeister-pdf.generator';
import { MitarbeiterPdfGenerator } from './generators/mitarbeiter-pdf.generator';
import { VertragPdfGenerator } from './generators/vertrag-pdf.generator';
import { ChecklistePdfGenerator } from './generators/checkliste-pdf.generator';

const mockPrisma = {
  $transaction: jest.fn(),
  pdfArchive: {
    count: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

const mockToken = {
  getToken: jest.fn(),
};

const mockRender = {
  clearCache: jest.fn(),
  createPdfWithHeaderFooter: jest.fn(),
  loadFirma: jest.fn(),
};

const mockRechnung = { create: jest.fn() };
const mockAngebot = { create: jest.fn() };
const mockMahnung = { create: jest.fn() };
const mockEuer = { create: jest.fn() };
const mockHausmeister = {
  createEinsatzPdf: jest.fn(),
  createMonatsnachweisPdf: jest.fn(),
};
const mockMitarbeiter = { createAbrechnungPdf: jest.fn() };
const mockVertrag = { create: jest.fn() };
const mockCheckliste = { createSubmissionPdf: jest.fn() };

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PdfTokenService, useValue: mockToken },
        { provide: PdfRenderService, useValue: mockRender },
        { provide: RechnungPdfGenerator, useValue: mockRechnung },
        { provide: AngebotPdfGenerator, useValue: mockAngebot },
        { provide: MahnungPdfGenerator, useValue: mockMahnung },
        { provide: EuerPdfGenerator, useValue: mockEuer },
        { provide: HausmeisterPdfGenerator, useValue: mockHausmeister },
        { provide: MitarbeiterPdfGenerator, useValue: mockMitarbeiter },
        { provide: VertragPdfGenerator, useValue: mockVertrag },
        { provide: ChecklistePdfGenerator, useValue: mockCheckliste },
      ],
    }).compile();

    service = module.get<PdfService>(PdfService);
    jest.resetAllMocks();
  });

  it('delegates PDF generation to the matching generator', async () => {
    mockRechnung.create.mockResolvedValue({ token: 'r', url: '/r' });
    mockAngebot.create.mockResolvedValue({ token: 'a', url: '/a' });
    mockMahnung.create.mockResolvedValue({ token: 'm', url: '/m' });
    mockEuer.create.mockResolvedValue({ token: 'e', url: '/e' });
    mockHausmeister.createEinsatzPdf.mockResolvedValue({
      token: 'he',
      url: '/he',
    });
    mockHausmeister.createMonatsnachweisPdf.mockResolvedValue({
      token: 'hm',
      url: '/hm',
    });
    mockMitarbeiter.createAbrechnungPdf.mockResolvedValue({
      token: 'ma',
      url: '/ma',
    });
    mockVertrag.create.mockResolvedValue({ token: 'v', url: '/v' });
    mockCheckliste.createSubmissionPdf.mockResolvedValue({
      token: 'c',
      url: '/c',
    });

    await expect(service.createRechnungPdf(1)).resolves.toEqual({
      token: 'r',
      url: '/r',
    });
    await expect(service.createAngebotPdf(2)).resolves.toEqual({
      token: 'a',
      url: '/a',
    });
    await expect(service.createMahnungPdf(3)).resolves.toEqual({
      token: 'm',
      url: '/m',
    });
    await expect(service.createEuerPdf(2026, { summe: 1 })).resolves.toEqual({
      token: 'e',
      url: '/e',
    });
    await expect(
      service.createHausmeisterEinsatzPdf(4, {
        role: 'admin',
        employeeId: null,
      }),
    ).resolves.toEqual({ token: 'he', url: '/he' });
    await expect(
      service.createHausmeisterMonatsnachweisPdf('2026-05', undefined, {
        role: 'admin',
        employeeId: null,
      }),
    ).resolves.toEqual({ token: 'hm', url: '/hm' });
    await expect(service.createMitarbeiterAbrechnungPdf(5)).resolves.toEqual({
      token: 'ma',
      url: '/ma',
    });
    await expect(service.createVertragPdf(6)).resolves.toEqual({
      token: 'v',
      url: '/v',
    });
    await expect(
      service.createChecklisteSubmissionPdf(7, {
        role: 'admin',
        employeeId: null,
      }),
    ).resolves.toEqual({ token: 'c', url: '/c' });
  });

  it('reads and maps paginated archive entries', async () => {
    const createdAt = new Date('2026-05-07T10:00:00.000Z');
    mockPrisma.pdfArchive.findMany.mockResolvedValue([
      {
        id: 11n,
        typ: 'rechnung',
        referenz_nr: 'R-1',
        referenz_id: 9n,
        empf: 'Customer',
        titel: 'Invoice',
        datum: new Date('2026-05-07T00:00:00.000Z'),
        filename: 'r.pdf',
        erstellt_am: createdAt,
      },
    ]);
    mockPrisma.pdfArchive.count.mockResolvedValue(1);
    mockPrisma.$transaction.mockImplementation(
      (queries: Array<Promise<unknown>>) => Promise.all(queries),
    );

    await expect(
      service.getArchive(
        { page: 2, pageSize: 10 },
        { q: 'R-', typ: 'rechnung' },
      ),
    ).resolves.toMatchObject({
      total: 1,
      page: 2,
      pageSize: 10,
      data: [{ id: 11, referenz_id: 9, filename: 'r.pdf' }],
    });

    expect(mockPrisma.pdfArchive.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        where: expect.objectContaining({ AND: expect.any(Array) }),
      }),
    );
  });

  it('regenerates archived HTML and rejects entries without HTML', async () => {
    const pdf = Buffer.from('pdf');
    mockRender.loadFirma.mockResolvedValue({ firma: 'PBS' });
    mockRender.createPdfWithHeaderFooter.mockResolvedValue(pdf);
    mockPrisma.pdfArchive.findUnique.mockResolvedValueOnce({
      html_body: '<main>Invoice</main>',
    });

    await expect(service.regenerateArchive(11)).resolves.toEqual(pdf);
    expect(mockRender.createPdfWithHeaderFooter).toHaveBeenCalledWith(
      '<main>Invoice</main>',
      { firma: 'PBS' },
    );

    mockPrisma.pdfArchive.findUnique.mockResolvedValueOnce({ html_body: null });
    await expect(service.regenerateArchive(12)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('passes token, archive cleanup, archive deletion, and cache clearing through', () => {
    mockToken.getToken.mockReturnValue({
      pdf: Buffer.from('pdf'),
      filename: 'x',
    });
    mockPrisma.pdfArchive.delete.mockResolvedValue({});
    mockPrisma.pdfArchive.deleteMany.mockResolvedValue({ count: 2 });
    mockRender.clearCache.mockReturnValue({ ok: true });

    expect(service.getToken('abc')).toMatchObject({ filename: 'x' });
    expect(service.clearCache()).toEqual({ ok: true });
    return expect(service.cleanArchive()).resolves.toEqual({
      ok: true,
      deleted: 2,
    });
  });
});
