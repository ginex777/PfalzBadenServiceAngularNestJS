import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BelegeService } from './belege.service';
import { PrismaService } from '../../core/database/prisma.service';

type BelegePrismaMock = {
  $transaction: jest.Mock;
  belege: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
  };
  buchhaltung: {
    update: jest.Mock;
  };
};

function createPrismaMock(): BelegePrismaMock {
  return {
    $transaction: jest.fn(),
    belege: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    buchhaltung: {
      update: jest.fn(),
    },
  };
}

function uploadFile(buffer = Buffer.from('%PDF-test')): Express.Multer.File {
  return {
    fieldname: 'beleg',
    originalname: 'rechnung.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: buffer.byteLength,
    buffer,
    destination: '',
    filename: '',
    path: '',
    stream: undefined as never,
  };
}

describe('BelegeService', () => {
  let service: BelegeService;
  let prisma: BelegePrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [BelegeService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<BelegeService>(BelegeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects missing upload files before hashing', async () => {
    await expect(service.belegHochladen(undefined)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.belege.findUnique).not.toHaveBeenCalled();
  });

  it('rejects duplicate receipt uploads by SHA-256', async () => {
    prisma.belege.findUnique.mockResolvedValue({ id: 1n });

    await expect(service.belegHochladen(uploadFile())).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.belege.create).not.toHaveBeenCalled();
  });

  it('stores validated receipt metadata and bytes', async () => {
    prisma.belege.findUnique.mockResolvedValue(null);
    prisma.belege.create.mockResolvedValue({
      id: 7n,
      buchhaltung_id: null,
      filename: 'rechnung.pdf',
      mimetype: 'application/pdf',
      filesize: 9,
      sha256: 'hash',
      typ: 'beleg',
      notiz: null,
      aufbewahrung_bis: new Date('2036-01-01T00:00:00.000Z'),
      erstellt_am: new Date('2026-01-01T00:00:00.000Z'),
      data: new Uint8Array(),
    });

    await service.belegHochladen(uploadFile());

    expect(prisma.belege.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          filename: 'rechnung.pdf',
          mimetype: 'application/pdf',
          data: expect.any(Uint8Array),
        }),
      }),
    );
  });

  it('keeps zero-value booking amounts in list results', async () => {
    prisma.belege.findMany.mockReturnValue('findManyCall');
    prisma.belege.count.mockReturnValue('countCall');
    prisma.$transaction.mockResolvedValue([
      [
        {
          id: 1n,
          buchhaltung_id: 2n,
          filename: 'zero.pdf',
          mimetype: 'application/pdf',
          filesize: 1,
          sha256: 'sha',
          typ: 'beleg',
          notiz: null,
          aufbewahrung_bis: null,
          erstellt_am: new Date('2026-01-01T00:00:00.000Z'),
          buchhaltung: {
            name: 'Zero',
            brutto: 0,
            kategorie: 'Test',
          },
        },
      ],
      1,
    ]);

    const result = await service.belegeLaden({ page: 1, pageSize: 50 });

    expect(result.data[0]?.buchung_brutto).toBe(0);
  });
});
