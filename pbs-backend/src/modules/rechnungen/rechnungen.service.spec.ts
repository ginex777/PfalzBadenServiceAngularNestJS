import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { RechnungenService } from './rechnungen.service';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';

const mockPrisma = {
  rechnungen: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockAudit = { protokollieren: jest.fn() };

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

  describe('alleRechnungenLaden()', () => {
    it('gibt gemappte Rechnungen zurück', async () => {
      const row = { id: 1n, nr: 'R-001', empf: 'Test', brutto: 100, mwst_satz: 19, bezahlt: false, kunden_id: null };
      mockPrisma.rechnungen.findMany.mockResolvedValue([row]);

      const result = await service.alleRechnungenLaden();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1); // BigInt → Number
      expect(result[0].brutto).toBe(100);
      expect(mockPrisma.rechnungen.findMany).toHaveBeenCalledTimes(1);
    });

    it('gibt leere Liste zurück wenn keine Rechnungen', async () => {
      mockPrisma.rechnungen.findMany.mockResolvedValue([]);
      const result = await service.alleRechnungenLaden();
      expect(result).toEqual([]);
    });
  });

  describe('rechnungErstellen()', () => {
    const daten = { nr: 'R-2026-001', empf: 'Mustermann GmbH', brutto: 500, positionen: [], mwst_satz: 19 };

    it('erstellt Rechnung und protokolliert im Audit', async () => {
      const created = { id: 1n, ...daten, brutto: 500, mwst_satz: 19, bezahlt: false, kunden_id: null };
      mockPrisma.rechnungen.findUnique.mockResolvedValue(null); // kein Duplikat
      mockPrisma.rechnungen.create.mockResolvedValue(created);
      mockAudit.protokollieren.mockResolvedValue(undefined);

      const result = await service.rechnungErstellen(daten, 'Dennis');

      expect(mockPrisma.rechnungen.create).toHaveBeenCalledTimes(1);
      expect(mockAudit.protokollieren).toHaveBeenCalledWith('rechnungen', created.id, 'CREATE', null, created, 'Dennis');
      expect(result.id).toBe(1);
    });

    it('wirft ConflictException wenn Rechnungsnummer bereits existiert', async () => {
      mockPrisma.rechnungen.findUnique.mockResolvedValue({ id: 2n, nr: 'R-2026-001' });

      await expect(service.rechnungErstellen(daten)).rejects.toThrow(ConflictException);
      expect(mockPrisma.rechnungen.create).not.toHaveBeenCalled();
    });
  });

  describe('rechnungAktualisieren()', () => {
    it('wirft NotFoundException wenn Rechnung nicht gefunden', async () => {
      mockPrisma.rechnungen.findUnique.mockResolvedValue(null);

      await expect(service.rechnungAktualisieren(999, { nr: 'X', empf: 'Y' })).rejects.toThrow(NotFoundException);
    });

    it('wirft ForbiddenException wenn bezahlte Rechnung inhaltlich geändert wird', async () => {
      mockPrisma.rechnungen.findUnique.mockResolvedValue({ id: 1n, nr: 'R-001', bezahlt: true });

      await expect(service.rechnungAktualisieren(1, { nr: 'R-001', empf: 'Geändert', bezahlt: true }))
        .rejects.toThrow(ForbiddenException);
    });

    it('erlaubt Statusänderung bezahlt→unbezahlt auf bezahlter Rechnung', async () => {
      const alt = { id: 1n, nr: 'R-001', empf: 'Test', bezahlt: true, brutto: 100, mwst_satz: 19, kunden_id: null };
      const updated = { ...alt, bezahlt: false };
      mockPrisma.rechnungen.findUnique.mockResolvedValue(alt);
      mockPrisma.rechnungen.findFirst.mockResolvedValue(null);
      mockPrisma.rechnungen.update.mockResolvedValue(updated);
      mockAudit.protokollieren.mockResolvedValue(undefined);

      const result = await service.rechnungAktualisieren(1, { nr: 'R-001', empf: 'Test', bezahlt: false });

      expect(result.bezahlt).toBe(false);
      expect(mockAudit.protokollieren).toHaveBeenCalledWith('rechnungen', 1n, 'UPDATE', alt, updated, undefined);
    });
  });

  describe('rechnungLoeschen()', () => {
    it('wirft NotFoundException wenn Rechnung nicht gefunden', async () => {
      mockPrisma.rechnungen.findUnique.mockResolvedValue(null);
      await expect(service.rechnungLoeschen(999)).rejects.toThrow(NotFoundException);
    });

    it('wirft ForbiddenException wenn Rechnung bezahlt ist', async () => {
      mockPrisma.rechnungen.findUnique.mockResolvedValue({ id: 1n, nr: 'R-001', bezahlt: true });
      await expect(service.rechnungLoeschen(1)).rejects.toThrow(ForbiddenException);
    });

    it('löscht Rechnung und protokolliert im Audit', async () => {
      const alt = { id: 1n, nr: 'R-001', empf: 'Test', bezahlt: false };
      mockPrisma.rechnungen.findUnique.mockResolvedValue(alt);
      mockPrisma.rechnungen.delete.mockResolvedValue(alt);
      mockAudit.protokollieren.mockResolvedValue(undefined);

      const result = await service.rechnungLoeschen(1, 'Dennis');

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.rechnungen.delete).toHaveBeenCalledWith({ where: { id: 1n } });
      expect(mockAudit.protokollieren).toHaveBeenCalledWith('rechnungen', 1n, 'DELETE', alt, null, 'Dennis');
    });
  });
});
