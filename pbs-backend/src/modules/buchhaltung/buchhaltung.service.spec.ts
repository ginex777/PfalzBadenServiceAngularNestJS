import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BuchhaltungService } from './buchhaltung.service';
import { PrismaService } from '../../core/database/prisma.service';
import type { BuchhaltungEintragDto } from './dto/buchhaltung.dto';

const mockTx = {
  buchhaltung: {
    update: jest.fn(),
    create: jest.fn(),
  },
};

const mockPrisma = {
  buchhaltung: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  gesperrteMonat: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  vstPaid: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('BuchhaltungService', () => {
  let service: BuchhaltungService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuchhaltungService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BuchhaltungService>(BuchhaltungService);
    jest.clearAllMocks();
  });

  describe('getYearData()', () => {
    it('gruppiert Einnahmen und Ausgaben korrekt nach Monat', async () => {
      const rows = [
        {
          id: 1n,
          monat: 0,
          typ: 'inc',
          brutto: 100,
          mwst: 19,
          abzug: 100,
          beleg_id: null,
        },
        {
          id: 2n,
          monat: 0,
          typ: 'exp',
          brutto: 50,
          mwst: 19,
          abzug: 100,
          beleg_id: null,
        },
        {
          id: 3n,
          monat: 1,
          typ: 'inc',
          brutto: 200,
          mwst: 19,
          abzug: 100,
          beleg_id: null,
        },
      ];
      mockPrisma.buchhaltung.findMany.mockResolvedValue(rows);

      const result = await service.getYearData(2026);

      expect(result[0].inc).toHaveLength(1);
      expect(result[0].exp).toHaveLength(1);
      expect(result[1].inc).toHaveLength(1);
      expect((result[0].inc[0] as { id: number }).id).toBe(1); // BigInt → Number
    });

    it('initialisiert alle 12 Monate auch wenn keine Daten', async () => {
      mockPrisma.buchhaltung.findMany.mockResolvedValue([]);
      const result = await service.getYearData(2026);
      expect(Object.keys(result)).toHaveLength(12);
    });
  });

  describe('getYearSummary()', () => {
    it('berechnet Netto, Umsatzsteuer, Vorsteuer, Zahllast und Gewinn serverseitig', async () => {
      mockPrisma.buchhaltung.findMany.mockResolvedValue([
        {
          id: 1n,
          jahr: 2026,
          monat: 0,
          typ: 'inc',
          brutto: 119,
          mwst: 19,
          abzug: 100,
          beleg_id: null,
        },
        {
          id: 2n,
          jahr: 2026,
          monat: 0,
          typ: 'exp',
          brutto: 59.5,
          mwst: 19,
          abzug: 50,
          beleg_id: null,
        },
      ]);

      const result = await service.getYearSummary(2026);

      expect(result.months[0]).toEqual({
        month: 0,
        incomeNet: 100,
        incomeVat: 19,
        expenseNet: 25,
        inputVat: 4.75,
        vatLiability: 14.25,
        profit: 75,
      });
      expect(result.quarters[0].elster).toEqual({
        kz81: 100,
        kz83: 19,
        kz86: 0,
        kz85: 0,
        kz66: 4.75,
      });
    });
  });

  describe('create()', () => {
    it('wirft BadRequestException wenn Monat gesperrt ist', async () => {
      mockPrisma.gesperrteMonat.findUnique.mockResolvedValue({ id: 1 });
      await expect(
        service.create({ jahr: 2026, monat: 0, typ: 'inc', brutto: 100 }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.buchhaltung.create).not.toHaveBeenCalled();
    });

    it('erstellt Eintrag wenn Monat nicht gesperrt', async () => {
      const created = {
        id: 1n,
        monat: 0,
        typ: 'inc',
        brutto: 100,
        mwst: 19,
        abzug: 100,
        beleg_id: null,
      };
      mockPrisma.gesperrteMonat.findUnique.mockResolvedValue(null);
      mockPrisma.buchhaltung.create.mockResolvedValue(created);

      const result = await service.create({
        jahr: 2026,
        monat: 0,
        typ: 'inc',
        brutto: 100,
      });

      expect(result.id).toBe(1);
    });
  });

  describe('saveBatch()', () => {
    it('wirft BadRequestException wenn Monat gesperrt ist', async () => {
      mockPrisma.gesperrteMonat.findUnique.mockResolvedValue({ id: 1 });
      await expect(service.saveBatch(2026, 0, [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('verwendet $transaction für alle Zeilen', async () => {
      mockPrisma.gesperrteMonat.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
      );
      mockTx.buchhaltung.create.mockResolvedValue({
        id: 1n,
        monat: 0,
        typ: 'exp',
        brutto: 50,
        mwst: 19,
        abzug: 100,
        beleg_id: null,
      });

      const zeilen: BuchhaltungEintragDto[] = [
        { jahr: 2026, monat: 0, typ: 'exp', brutto: 50, mwst: 19, abzug: 100 },
      ];
      await service.saveBatch(2026, 0, zeilen);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.buchhaltung.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete()', () => {
    it('wirft NotFoundException wenn Eintrag nicht gefunden', async () => {
      mockPrisma.buchhaltung.findUnique.mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });

    it('wirft BadRequestException wenn Monat gesperrt', async () => {
      mockPrisma.buchhaltung.findUnique.mockResolvedValue({
        id: 1n,
        jahr: 2026,
        monat: 0,
      });
      mockPrisma.gesperrteMonat.findUnique.mockResolvedValue({ id: 1 });
      await expect(service.delete(1)).rejects.toThrow(BadRequestException);
    });

    it('löscht Eintrag erfolgreich', async () => {
      const entry = { id: 1n, jahr: 2026, monat: 1 };
      mockPrisma.buchhaltung.findUnique.mockResolvedValue(entry);
      mockPrisma.gesperrteMonat.findUnique.mockResolvedValue(null);
      mockPrisma.buchhaltung.delete.mockResolvedValue(entry);

      const result = await service.delete(1);
      expect(result).toEqual({ ok: true });
    });
  });

  describe('lockMonth() / unlockMonth()', () => {
    it('sperrt einen Monat via upsert', async () => {
      const row = { id: 1n, jahr: 2026, monat: 2 };
      mockPrisma.gesperrteMonat.upsert.mockResolvedValue(row);

      const result = await service.lockMonth(2026, 2);

      expect(mockPrisma.gesperrteMonat.upsert).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(1);
    });

    it('entsperrt einen Monat via deleteMany', async () => {
      mockPrisma.gesperrteMonat.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.unlockMonth(2026, 2);

      expect(mockPrisma.gesperrteMonat.deleteMany).toHaveBeenCalledWith({
        where: { jahr: 2026, monat: 2 },
      });
      expect(result).toEqual({ ok: true });
    });
  });
});
