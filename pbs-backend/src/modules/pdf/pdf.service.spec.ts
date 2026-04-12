import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';
import { PrismaService } from '../../core/database/prisma.service';
import { PuppeteerService } from './puppeteer.service';

const mockPrisma = {};
const mockPuppeteer = { generatePdf: jest.fn() };

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfService,
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
