import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { RechnungenService } from './rechnungen.service';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';

const mockPrisma = {
  rechnungen: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockAudit = { log: jest.fn() };

describe('RechnungenService', () => {
  let service: RechnungenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RechnungenService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<RechnungenService>(RechnungenService);
    jest.clearAllMocks();
  });

  describe('findAll()', () => {
    it('gibt gemappte Rechnungen zurück', async () => {
      const row = {
        id: 1n,
        nr: 'R-001',
        empf: 'Test',
        brutto: 100,
        mwst_satz: 19,
        bezahlt: false,
        kunden_id: null,
      };
      mockPrisma.$transaction.mockResolvedValue([[row], 1]);

      const result = await service.findAll({ page: 1, pageSize: 100 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1); // BigInt → Number
      expect(result.data[0].brutto).toBe(100);
      expect(result.total).toBe(1);
    });

    it('gibt leere Liste zurück wenn keine Rechnungen', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);
      const result = await service.findAll({ page: 1, pageSize: 100 });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('create()', () => {
    const daten = {
      nr: 'R-2026-001',
      empf: 'Mustermann GmbH',
      brutto: 500,
      positionen: [],
      mwst_satz: 19,
    };

    it('erstellt Rechnung und protokolliert im Audit', async () => {
      const created = {
        id: 1n,
        ...daten,
        brutto: 500,
        mwst_satz: 19,
        bezahlt: false,
        kunden_id: null,
      };
      mockPrisma.rechnungen.findUnique.mockResolvedValue(null); // kein Duplikat
      mockPrisma.rechnungen.create.mockResolvedValue(created);
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.create(daten, 'Dennis');

      expect(mockPrisma.rechnungen.create).toHaveBeenCalledTimes(1);
      expect(mockAudit.log).toHaveBeenCalledWith(
        'rechnungen',
        created.id,
        'CREATE',
        null,
        created,
        'Dennis',
      );
      expect(result.id).toBe(1);
    });

    it('wirft ConflictException wenn Rechnungsnummer bereits existiert', async () => {
      mockPrisma.rechnungen.findUnique.mockResolvedValue({
        id: 2n,
        nr: 'R-2026-001',
      });

      await expect(service.create(daten)).rejects.toThrow(ConflictException);
      expect(mockPrisma.rechnungen.create).not.toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    it('wirft NotFoundException wenn Rechnung nicht gefunden', async () => {
      mockPrisma.rechnungen.findUnique.mockResolvedValue(null);

      await expect(
        service.update(999, {
          nr: 'X',
          empf: 'Y',
          brutto: 0,
          positionen: [],
          mwst_satz: 19,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('wirft ForbiddenException wenn bezahlte Rechnung inhaltlich geändert wird', async () => {
      mockPrisma.rechnungen.findUnique.mockResolvedValue({
        id: 1n,
        nr: 'R-001',
        bezahlt: true,
      });

      await expect(
        service.update(1, {
          nr: 'R-001',
          empf: 'Geändert',
          bezahlt: true,
          brutto: 100,
          positionen: [],
          mwst_satz: 19,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('erlaubt Statusänderung bezahlt→unbezahlt auf bezahlter Rechnung', async () => {
      const alt = {
        id: 1n,
        nr: 'R-001',
        empf: 'Test',
        bezahlt: true,
        brutto: 100,
        mwst_satz: 19,
        kunden_id: null,
      };
      const updated = { ...alt, bezahlt: false };
      mockPrisma.rechnungen.findUnique.mockResolvedValue(alt);
      mockPrisma.rechnungen.findFirst.mockResolvedValue(null);
      mockPrisma.rechnungen.update.mockResolvedValue(updated);
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.update(1, {
        nr: 'R-001',
        empf: 'Test',
        bezahlt: false,
        brutto: 100,
        positionen: [],
        mwst_satz: 19,
      });

      expect(result.bezahlt).toBe(false);
      expect(mockAudit.log).toHaveBeenCalledWith(
        'rechnungen',
        1n,
        'UPDATE',
        alt,
        updated,
        undefined,
      );
    });
  });

  describe('delete()', () => {
    it('wirft NotFoundException wenn Rechnung nicht gefunden', async () => {
      mockPrisma.rechnungen.findUnique.mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });

    it('wirft ForbiddenException wenn Rechnung bezahlt ist', async () => {
      mockPrisma.rechnungen.findUnique.mockResolvedValue({
        id: 1n,
        nr: 'R-001',
        bezahlt: true,
      });
      await expect(service.delete(1)).rejects.toThrow(ForbiddenException);
    });

    it('löscht Rechnung und protokolliert im Audit', async () => {
      const alt = { id: 1n, nr: 'R-001', empf: 'Test', bezahlt: false };
      mockPrisma.rechnungen.findUnique.mockResolvedValue(alt);
      mockPrisma.rechnungen.delete.mockResolvedValue(alt);
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.delete(1, 'Dennis');

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.rechnungen.delete).toHaveBeenCalledWith({
        where: { id: 1n },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        'rechnungen',
        1n,
        'DELETE',
        alt,
        null,
        'Dennis',
      );
    });
  });
});
