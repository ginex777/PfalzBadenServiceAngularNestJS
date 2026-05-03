import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AngeboteService } from './angebote.service';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';
import { Prisma } from '@prisma/client';

const mockPrisma = {
  angebote: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockAudit = { log: jest.fn() };

describe('AngeboteService', () => {
  let service: AngeboteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AngeboteService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AngeboteService>(AngeboteService);
    jest.clearAllMocks();
  });

  describe('findAll()', () => {
    it('gibt gemappte Angebote zurück (BigInt → Number)', async () => {
      const row = {
        id: 5n,
        nr: 'A-2026-001',
        empf: 'Firma X',
        brutto: 200,
        angenommen: false,
        abgelehnt: false,
        gesendet: false,
        kunden_id: null,
      };
      mockPrisma.$transaction.mockResolvedValue([[row], 1]);

      const result = await service.findAll({ page: 1, pageSize: 100 });

      expect(result.data[0].id).toBe(5);
      expect(result.data[0].brutto).toBe(200);
    });
  });

  describe('create()', () => {
    it('erstellt Angebot und protokolliert im Audit', async () => {
      const daten = {
        nr: 'A-001',
        empf: 'Test GmbH',
        brutto: 300,
        positionen: [],
      };
      const created = {
        id: 1n,
        ...daten,
        angenommen: false,
        abgelehnt: false,
        gesendet: false,
        kunden_id: null,
      };
      mockPrisma.angebote.create.mockResolvedValue(created);
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.create(daten, 'Dennis');

      expect(mockPrisma.angebote.create).toHaveBeenCalledTimes(1);
      expect(mockAudit.log).toHaveBeenCalledWith(
        'angebote',
        created.id,
        'CREATE',
        null,
        created,
        'Dennis',
      );
      expect(result.id).toBe(1);
    });

    it('berechnet Brutto serverseitig und ignoriert clientseitige Angebotssumme', async () => {
      const daten = {
        nr: 'A-002',
        empf: 'Test GmbH',
        brutto: 1,
        positionen: [
          { bez: 'Reinigung', gesamtpreis: 150 },
          { bez: 'Pflege', gesamtpreis: 50 },
        ],
      };
      const created = {
        id: 2n,
        ...daten,
        brutto: new Prisma.Decimal(238),
        angenommen: false,
        abgelehnt: false,
        gesendet: false,
        kunden_id: null,
      };
      mockPrisma.angebote.create.mockResolvedValue(created);
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.create(daten);

      expect(mockPrisma.angebote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          brutto: new Prisma.Decimal(238),
        }),
      });
      expect(result.brutto).toBe(238);
    });
  });

  describe('update()', () => {
    it('wirft NotFoundException wenn Angebot nicht gefunden', async () => {
      mockPrisma.angebote.findUnique.mockResolvedValue(null);
      await expect(
        service.update(999, {
          nr: 'X',
          empf: 'Y',
          brutto: 0,
          positionen: [],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('aktualisiert Angebot und protokolliert', async () => {
      const alt = {
        id: 1n,
        nr: 'A-001',
        empf: 'Alt',
        brutto: 100,
        angenommen: false,
        abgelehnt: false,
        gesendet: false,
        kunden_id: null,
      };
      const updated = { ...alt, empf: 'Neu', angenommen: true };
      mockPrisma.angebote.findUnique.mockResolvedValue(alt);
      mockPrisma.angebote.update.mockResolvedValue(updated);
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.update(1, {
        nr: 'A-001',
        empf: 'Neu',
        angenommen: true,
        brutto: 100,
        positionen: [],
      });

      expect(result.angenommen).toBe(true);
      expect(mockAudit.log).toHaveBeenCalledWith(
        'angebote',
        1n,
        'UPDATE',
        alt,
        updated,
        undefined,
      );
    });

    it('recomputes brutto on update and ignores submitted client brutto', async () => {
      const alt = {
        id: 1n,
        nr: 'A-001',
        empf: 'Alt',
        brutto: new Prisma.Decimal(119),
        angenommen: false,
        abgelehnt: false,
        gesendet: false,
        kunden_id: null,
      };
      const updated = {
        ...alt,
        brutto: new Prisma.Decimal(357),
        positionen: [{ bez: 'Neu', gesamtpreis: 300 }],
      };
      mockPrisma.angebote.findUnique.mockResolvedValue(alt);
      mockPrisma.angebote.update.mockResolvedValue(updated);
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.update(1, {
        nr: 'A-001',
        empf: 'Alt',
        brutto: 1,
        positionen: [{ bez: 'Neu', gesamtpreis: 300 }],
      });

      expect(mockPrisma.angebote.update).toHaveBeenCalledWith({
        where: { id: 1n },
        data: expect.objectContaining({
          brutto: new Prisma.Decimal(357),
        }),
      });
      expect(result.brutto).toBe(357);
    });
  });

  describe('delete()', () => {
    it('wirft NotFoundException wenn Angebot nicht gefunden', async () => {
      mockPrisma.angebote.findUnique.mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });

    it('löscht Angebot und protokolliert', async () => {
      const alt = { id: 1n, nr: 'A-001', empf: 'Test', angenommen: false };
      mockPrisma.angebote.findUnique.mockResolvedValue(alt);
      mockPrisma.angebote.delete.mockResolvedValue(alt);
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.delete(1, 'Dennis');

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.angebote.delete).toHaveBeenCalledWith({
        where: { id: 1n },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        'angebote',
        1n,
        'DELETE',
        alt,
        null,
        'Dennis',
      );
    });
  });
});
