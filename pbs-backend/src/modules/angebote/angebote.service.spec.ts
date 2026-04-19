import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AngeboteService } from './angebote.service';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';
import { UpdateAngebotDto } from './dto/angebot.dto';

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

const mockAudit = { protokollieren: jest.fn() };

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

  describe('alleAngeboteLaden()', () => {
    it('gibt gemappte Angebote zurück (BigInt → Number)', async () => {
      const row = { id: 5n, nr: 'A-2026-001', empf: 'Firma X', brutto: 200, angenommen: false, abgelehnt: false, gesendet: false, kunden_id: null };
      mockPrisma.$transaction.mockResolvedValue([[row], 1]);

      const result = await service.alleAngeboteLaden({ page: 1, limit: 100 });

      expect(result.data[0].id).toBe(5);
      expect(result.data[0].brutto).toBe(200);
    });
  });

  describe('angebotErstellen()', () => {
    it('erstellt Angebot und protokolliert im Audit', async () => {
      const daten = { nr: 'A-001', empf: 'Test GmbH', brutto: 300, positionen: [] };
      const created = { id: 1n, ...daten, angenommen: false, abgelehnt: false, gesendet: false, kunden_id: null };
      mockPrisma.angebote.create.mockResolvedValue(created);
      mockAudit.protokollieren.mockResolvedValue(undefined);

      const result = await service.angebotErstellen(daten, 'Dennis');

      expect(mockPrisma.angebote.create).toHaveBeenCalledTimes(1);
      expect(mockAudit.protokollieren).toHaveBeenCalledWith('angebote', created.id, 'CREATE', null, created, 'Dennis');
      expect(result.id).toBe(1);
    });
  });

  describe('angebotAktualisieren()', () => {
    it('wirft NotFoundException wenn Angebot nicht gefunden', async () => {
      mockPrisma.angebote.findUnique.mockResolvedValue(null);
      await expect(service.angebotAktualisieren(999, { nr: 'X', empf: 'Y' } as UpdateAngebotDto)).rejects.toThrow(NotFoundException);
    });

    it('aktualisiert Angebot und protokolliert', async () => {
      const alt = { id: 1n, nr: 'A-001', empf: 'Alt', brutto: 100, angenommen: false, abgelehnt: false, gesendet: false, kunden_id: null };
      const updated = { ...alt, empf: 'Neu', angenommen: true };
      mockPrisma.angebote.findUnique.mockResolvedValue(alt);
      mockPrisma.angebote.update.mockResolvedValue(updated);
      mockAudit.protokollieren.mockResolvedValue(undefined);

      const result = await service.angebotAktualisieren(1, { nr: 'A-001', empf: 'Neu', angenommen: true } as UpdateAngebotDto);

      expect(result.angenommen).toBe(true);
      expect(mockAudit.protokollieren).toHaveBeenCalledWith('angebote', 1n, 'UPDATE', alt, updated, undefined);
    });
  });

  describe('angebotLoeschen()', () => {
    it('wirft NotFoundException wenn Angebot nicht gefunden', async () => {
      mockPrisma.angebote.findUnique.mockResolvedValue(null);
      await expect(service.angebotLoeschen(999)).rejects.toThrow(NotFoundException);
    });

    it('löscht Angebot und protokolliert', async () => {
      const alt = { id: 1n, nr: 'A-001', empf: 'Test', angenommen: false };
      mockPrisma.angebote.findUnique.mockResolvedValue(alt);
      mockPrisma.angebote.delete.mockResolvedValue(alt);
      mockAudit.protokollieren.mockResolvedValue(undefined);

      const result = await service.angebotLoeschen(1, 'Dennis');

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.angebote.delete).toHaveBeenCalledWith({ where: { id: 1n } });
      expect(mockAudit.protokollieren).toHaveBeenCalledWith('angebote', 1n, 'DELETE', alt, null, 'Dennis');
    });
  });
});
