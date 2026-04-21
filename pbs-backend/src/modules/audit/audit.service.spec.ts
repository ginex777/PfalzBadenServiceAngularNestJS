import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../core/database/prisma.service';

const mockPrisma = {
  auditLog: {
    create: jest.fn(),
  },
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  it('sollte erstellt werden', () => {
    expect(service).toBeDefined();
  });

  describe('log()', () => {
    it('speichert CREATE-Eintrag mit korrekten Feldern', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({});
      const neuWert = { id: 1, name: 'Test' };

      await service.log('kunden', 1, 'CREATE', null, neuWert, 'Dennis');

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          tabelle: 'kunden',
          datensatz_id: 1n,
          aktion: 'CREATE',
          alt_wert: undefined,
          neu_wert: neuWert,
          nutzer: 'Dennis',
          nutzer_name: null,
        },
      });
    });

    it('speichert UPDATE-Eintrag mit alt_wert und neu_wert', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({});
      const alt = { id: 5, name: 'Alt' };
      const neu = { id: 5, name: 'Neu' };

      await service.log('rechnungen', BigInt(5), 'UPDATE', alt, neu, 'Tester');

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          tabelle: 'rechnungen',
          datensatz_id: 5n,
          aktion: 'UPDATE',
          alt_wert: alt,
          neu_wert: neu,
          nutzer: 'Tester',
          nutzer_name: null,
        },
      });
    });

    it('speichert DELETE-Eintrag ohne neu_wert', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({});
      const alt = { id: 2, name: 'Gelöscht' };

      await service.log('angebote', 2, 'DELETE', alt, null, undefined);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          aktion: 'DELETE',
          alt_wert: alt,
          neu_wert: undefined,
          nutzer: null,
        }),
      });
    });

    it('setzt nutzer auf null wenn nicht angegeben', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({});

      await service.log('kunden', 1, 'CREATE', null, {});

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ nutzer: null }),
      });
    });
  });
});
