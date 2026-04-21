import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { KundenService } from './kunden.service';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';

const mockPrisma = {
  kunden: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  rechnungen: { count: jest.fn() },
  angebote: { count: jest.fn() },
  $transaction: jest.fn(),
};

const mockAudit = { log: jest.fn() };

describe('KundenService', () => {
  let service: KundenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KundenService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<KundenService>(KundenService);
    jest.clearAllMocks();
  });

  describe('findAll()', () => {
    it('gibt gemappte Kunden zurück (BigInt → Number)', async () => {
      const row = {
        id: 3n,
        name: 'Müller GmbH',
        email: 'mueller@test.de',
        strasse: null,
        ort: null,
        tel: null,
        notiz: null,
      };
      mockPrisma.$transaction.mockResolvedValue([[row], 1]);

      const result = await service.findAll({ page: 1, pageSize: 100 });

      expect(result.data[0].id).toBe(3);
      expect(result.data[0].name).toBe('Müller GmbH');
    });
  });

  describe('create()', () => {
    it('akzeptiert gültige E-Mail (test@test.de)', async () => {
      const created = {
        id: 1n,
        name: 'Test',
        email: 'test@test.de',
        strasse: null,
        ort: null,
        tel: null,
        notiz: null,
      };
      mockPrisma.kunden.create.mockResolvedValue(created);
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.create({
        name: 'Test',
        email: 'test@test.de',
      });

      expect(result.id).toBe(1);
      expect(mockAudit.log).toHaveBeenCalledWith(
        'kunden',
        created.id,
        'CREATE',
        null,
        created,
        undefined,
      );
    });

    it('akzeptiert fehlende E-Mail (optional)', async () => {
      const created = {
        id: 2n,
        name: 'Nur Name',
        email: null,
        strasse: null,
        ort: null,
        tel: null,
        notiz: null,
      };
      mockPrisma.kunden.create.mockResolvedValue(created);
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.create({ name: 'Nur Name' });

      expect(result.id).toBe(2);
    });
  });

  describe('update()', () => {
    it('wirft NotFoundException wenn Kunde nicht gefunden', async () => {
      mockPrisma.kunden.findUnique.mockResolvedValue(null);
      await expect(service.update(999, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('aktualisiert Kunde und protokolliert', async () => {
      const alt = {
        id: 1n,
        name: 'Alt',
        email: null,
        strasse: null,
        ort: null,
        tel: null,
        notiz: null,
      };
      const neu = { ...alt, name: 'Neu GmbH', email: 'neu@test.de' };
      mockPrisma.kunden.findUnique.mockResolvedValue(alt);
      mockPrisma.kunden.update.mockResolvedValue(neu);
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.update(1, {
        name: 'Neu GmbH',
        email: 'neu@test.de',
      });

      expect(result.name).toBe('Neu GmbH');
      expect(mockAudit.log).toHaveBeenCalledWith(
        'kunden',
        1n,
        'UPDATE',
        alt,
        neu,
        undefined,
      );
    });
  });

  describe('delete()', () => {
    it('wirft NotFoundException wenn Kunde nicht gefunden', async () => {
      mockPrisma.kunden.findUnique.mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });

    it('wirft ConflictException wenn Rechnungen oder Angebote verknüpft sind', async () => {
      mockPrisma.kunden.findUnique.mockResolvedValue({ id: 1n, name: 'Test' });
      mockPrisma.rechnungen.count.mockResolvedValue(2);
      mockPrisma.angebote.count.mockResolvedValue(0);

      await expect(service.delete(1)).rejects.toThrow(ConflictException);
      expect(mockPrisma.kunden.delete).not.toHaveBeenCalled();
    });

    it('löscht Kunden wenn keine Dokumente verknüpft sind', async () => {
      const alt = { id: 1n, name: 'Leer' };
      mockPrisma.kunden.findUnique.mockResolvedValue(alt);
      mockPrisma.rechnungen.count.mockResolvedValue(0);
      mockPrisma.angebote.count.mockResolvedValue(0);
      mockPrisma.kunden.delete.mockResolvedValue(alt);
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.delete(1, 'Dennis');

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.kunden.delete).toHaveBeenCalledWith({
        where: { id: 1n },
      });
    });
  });
});
