import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../core/database/prisma.service';
import { PdfRenderService } from '../pdf-render.service';
import { PdfTokenService } from '../pdf-token.service';
import { HausmeisterPdfGenerator } from './hausmeister-pdf.generator';

const mockPrisma = {
  hausmeisterEinsaetze: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  pdfArchive: {
    create: jest.fn(),
  },
};

const mockRender = {
  logoBase64: '',
  loadFirma: jest.fn(),
  renderTemplate: jest.fn(),
  createPdfWithHeaderFooter: jest.fn(),
  formatDate: jest.fn(),
};

const mockToken = {
  createToken: jest.fn(),
};

describe('HausmeisterPdfGenerator authorization', () => {
  let generator: HausmeisterPdfGenerator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HausmeisterPdfGenerator,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PdfRenderService, useValue: mockRender },
        { provide: PdfTokenService, useValue: mockToken },
      ],
    }).compile();

    generator = module.get<HausmeisterPdfGenerator>(HausmeisterPdfGenerator);
    jest.resetAllMocks();
    mockRender.loadFirma.mockResolvedValue({});
    mockRender.renderTemplate.mockReturnValue('<html></html>');
    mockRender.createPdfWithHeaderFooter.mockResolvedValue(Buffer.from('pdf'));
    mockRender.formatDate.mockImplementation((value: string) => value);
    mockToken.createToken.mockReturnValue({ token: 'token', url: '/view' });
  });

  it('hides another employee hausmeister entry from employee PDF generation', async () => {
    mockPrisma.hausmeisterEinsaetze.findUnique.mockResolvedValue({
      id: 31n,
      mitarbeiter_id: 22n,
      mitarbeiter_name: 'Other User',
      kunden_id: null,
      kunden_name: null,
      datum: new Date('2026-05-01T00:00:00.000Z'),
      taetigkeiten: [],
      stunden_gesamt: 1,
    });

    await expect(
      generator.createEinsatzPdf(31, {
        role: 'mitarbeiter',
        employeeId: 11,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(mockRender.loadFirma).not.toHaveBeenCalled();
    expect(mockPrisma.pdfArchive.create).not.toHaveBeenCalled();
  });

  it('requires employee mapping for employee hausmeister PDFs', async () => {
    mockPrisma.hausmeisterEinsaetze.findUnique.mockResolvedValue({
      id: 31n,
      mitarbeiter_id: 22n,
      mitarbeiter_name: 'Other User',
      kunden_id: null,
      kunden_name: null,
      datum: new Date('2026-05-01T00:00:00.000Z'),
      taetigkeiten: [],
      stunden_gesamt: 1,
    });

    await expect(
      generator.createEinsatzPdf(31, {
        role: 'mitarbeiter',
        employeeId: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('scopes employee monthly hausmeister PDFs by employee id', async () => {
    mockPrisma.hausmeisterEinsaetze.findMany.mockResolvedValue([]);

    await generator.createMonatsnachweisPdf('2026-05', 'Ignored Name', {
      role: 'mitarbeiter',
      employeeId: 11,
    });

    expect(mockPrisma.hausmeisterEinsaetze.findMany).toHaveBeenCalledWith({
      where: {
        datum: {
          gte: new Date(2026, 4, 1),
          lte: new Date(2026, 5, 0),
        },
        mitarbeiter_id: 11n,
      },
      orderBy: { datum: 'asc' },
    });
  });
});
