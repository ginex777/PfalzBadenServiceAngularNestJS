import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { MitarbeiterService } from './mitarbeiter.service';
import { PrismaService } from '../../core/database/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { Prisma } from '@prisma/client';
import { AccessPolicyService } from '../access-policy/access-policy.service';

const mockPrisma = {
  mitarbeiter: {
    findUnique: jest.fn(),
  },
  mitarbeiterStunden: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockAccessPolicy = {
  assertCanAccessEmployee: jest.fn(),
  assertCanAccessObject: jest.fn(),
};

describe('MitarbeiterService', () => {
  let service: MitarbeiterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MitarbeiterService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TasksService, useValue: {} },
        { provide: AccessPolicyService, useValue: mockAccessPolicy },
      ],
    }).compile();

    service = module.get<MitarbeiterService>(MitarbeiterService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('berechnet Lohn und Zuschlag beim Stundeneintrag serverseitig', async () => {
    mockPrisma.mitarbeiter.findUnique.mockResolvedValue({
      id: 1n,
      stundenlohn: 20,
    });
    mockPrisma.mitarbeiterStunden.create.mockResolvedValue({
      id: 10n,
      mitarbeiter_id: 1n,
      datum: new Date('2026-05-01T00:00:00.000Z'),
      stunden: 2,
      beschreibung: null,
      ort: null,
      lohn: 50,
      zuschlag: 5,
      zuschlag_typ: '10%',
      bezahlt: false,
    });

    const result = await service.stundenErstellen(1, {
      datum: '2026-05-01',
      stunden: 2,
      lohn_satz: 25,
      zuschlag_typ: '10%',
    });

    expect(mockPrisma.mitarbeiterStunden.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        lohn: new Prisma.Decimal(50),
        zuschlag: new Prisma.Decimal(5),
      }),
    });
    expect(result.lohn).toBe(50);
    expect(result.zuschlag).toBe(5);
  });

  it('aktualisiert Zahlungsstatus ohne Lohn neu zu berechnen', async () => {
    mockPrisma.mitarbeiterStunden.findUnique.mockResolvedValue({
      id: 10n,
      mitarbeiter_id: 1n,
      datum: new Date('2026-05-01T00:00:00.000Z'),
      stunden: 2,
      lohn: 50,
      zuschlag: 5,
      zuschlag_typ: '10%',
      bezahlt: false,
    });
    mockPrisma.mitarbeiterStunden.update.mockResolvedValue({
      id: 10n,
      mitarbeiter_id: 1n,
      datum: new Date('2026-05-01T00:00:00.000Z'),
      stunden: 2,
      lohn: 50,
      zuschlag: 5,
      zuschlag_typ: '10%',
      bezahlt: true,
    });

    const result = await service.stundenAktualisieren(10, { bezahlt: true });

    expect(mockPrisma.mitarbeiter.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.mitarbeiterStunden.update).toHaveBeenCalledWith({
      where: { id: 10n },
      data: { bezahlt: true },
    });
    expect(result.bezahlt).toBe(true);
  });

  it('checks employee authorization before starting a time-clock entry', async () => {
    mockAccessPolicy.assertCanAccessEmployee.mockRejectedValue(
      new Error('blocked'),
    );

    await expect(
      service.stempelStart(
        22,
        { objektId: 7 },
        { role: 'mitarbeiter', employeeId: 11 },
      ),
    ).rejects.toThrow('blocked');

    expect(mockAccessPolicy.assertCanAccessEmployee).toHaveBeenCalledWith(
      { role: 'mitarbeiter', employeeId: 11 },
      22,
    );
    expect(mockAccessPolicy.assertCanAccessObject).not.toHaveBeenCalled();
  });

  it('checks employee authorization before stopping a time-clock entry', async () => {
    mockAccessPolicy.assertCanAccessEmployee.mockRejectedValue(
      new Error('blocked'),
    );

    await expect(
      service.stempelStop(22, { role: 'mitarbeiter', employeeId: 11 }),
    ).rejects.toThrow('blocked');

    expect(mockAccessPolicy.assertCanAccessEmployee).toHaveBeenCalledWith(
      { role: 'mitarbeiter', employeeId: 11 },
      22,
    );
    expect(mockPrisma.mitarbeiterStunden.findUnique).not.toHaveBeenCalled();
  });

  it('checks employee authorization before loading time-clock history', async () => {
    mockAccessPolicy.assertCanAccessEmployee.mockRejectedValue(
      new Error('blocked'),
    );

    await expect(
      service.zeiterfassungLaden(22, { role: 'mitarbeiter', employeeId: 11 }),
    ).rejects.toThrow('blocked');

    expect(mockAccessPolicy.assertCanAccessEmployee).toHaveBeenCalledWith(
      { role: 'mitarbeiter', employeeId: 11 },
      22,
    );
    expect(mockPrisma.mitarbeiterStunden.findUnique).not.toHaveBeenCalled();
  });

  it('checks employee authorization before loading the active time-clock entry', async () => {
    mockAccessPolicy.assertCanAccessEmployee.mockRejectedValue(
      new Error('blocked'),
    );

    await expect(
      service.aktiverStempel(22, { role: 'mitarbeiter', employeeId: 11 }),
    ).rejects.toThrow('blocked');

    expect(mockAccessPolicy.assertCanAccessEmployee).toHaveBeenCalledWith(
      { role: 'mitarbeiter', employeeId: 11 },
      22,
    );
    expect(mockPrisma.mitarbeiterStunden.findUnique).not.toHaveBeenCalled();
  });
});
