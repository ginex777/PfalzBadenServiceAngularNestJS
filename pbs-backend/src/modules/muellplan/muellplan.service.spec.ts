import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { MuellplanService } from './muellplan.service';
import { PrismaService } from '../../core/database/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { AccessPolicyService } from '../access-policy/access-policy.service';

const mockPrisma = {
  muellplan: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  muellplanPdf: {
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
  objekte: {
    findUnique: jest.fn(),
  },
  benachrichtigungen: {
    create: jest.fn(),
  },
};

const mockAccessPolicy = {
  assertCanAccessObject: jest.fn(),
  accessibleObjectIds: jest.fn(),
};

const mockTasksService = {
  upsertFromMuellplan: jest.fn(),
};

describe('MuellplanService', () => {
  let service: MuellplanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MuellplanService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TasksService, useValue: mockTasksService },
        { provide: AccessPolicyService, useValue: mockAccessPolicy },
      ],
    }).compile();

    service = module.get<MuellplanService>(MuellplanService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('checks object authorization before loading object waste-plan terms', async () => {
    mockAccessPolicy.assertCanAccessObject.mockRejectedValue(
      new Error('blocked'),
    );

    await expect(
      service.termineLaden(7, { role: 'mitarbeiter', employeeId: 11 }),
    ).rejects.toThrow('blocked');

    expect(mockAccessPolicy.assertCanAccessObject).toHaveBeenCalledWith(
      { role: 'mitarbeiter', employeeId: 11 },
      7,
    );
    expect(mockPrisma.muellplan.findMany).not.toHaveBeenCalled();
  });

  it('filters upcoming waste-plan terms to assigned objects for employees', async () => {
    mockAccessPolicy.accessibleObjectIds.mockResolvedValue([7n, 9n]);
    mockPrisma.muellplan.findMany.mockResolvedValue([]);

    await service.anstehendeTermineLaden(5, {
      role: 'mitarbeiter',
      employeeId: 11,
    });

    expect(mockPrisma.muellplan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ objekt_id: { in: [7n, 9n] } }),
      }),
    );
  });

  it('checks authorization against the loaded pickup object before completion', async () => {
    mockPrisma.muellplan.findUnique.mockResolvedValue({ objekt_id: 7n });
    mockAccessPolicy.assertCanAccessObject.mockRejectedValue(
      new Error('blocked'),
    );

    await expect(
      service.terminErledigen(15, {}, { role: 'mitarbeiter', employeeId: 11 }),
    ).rejects.toThrow('blocked');

    expect(mockAccessPolicy.assertCanAccessObject).toHaveBeenCalledWith(
      { role: 'mitarbeiter', employeeId: 11 },
      7,
    );
    expect(mockPrisma.muellplan.update).not.toHaveBeenCalled();
  });

  it('copies only missing waste-plan terms to the target object', async () => {
    mockPrisma.muellplan.findMany
      .mockResolvedValueOnce([
        {
          muellart: 'Papier',
          farbe: '#00f',
          abholung: new Date('2026-05-08T00:00:00.000Z'),
        },
        {
          muellart: 'Restmuell',
          farbe: '#111',
          abholung: new Date('2026-05-09T00:00:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          muellart: 'Papier',
          abholung: new Date('2026-05-08T00:00:00.000Z'),
        },
      ]);
    mockPrisma.muellplan.create.mockResolvedValue({});

    const result = await service.termineKopieren(1, 2);

    expect(result).toEqual({ ok: true, added: 1 });
    expect(mockPrisma.muellplan.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.muellplan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          muellart: 'Restmuell',
          objekte: { connect: { id: 2n } },
        }),
      }),
    );
  });

  it('confirms uploaded waste-plan evidence and skips duplicate extracted terms', async () => {
    mockAccessPolicy.assertCanAccessObject.mockResolvedValue(undefined);
    mockPrisma.objekte.findUnique.mockResolvedValue({
      id: 7n,
      name: 'Objekt A',
    });
    mockPrisma.muellplanPdf.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.muellplan.findMany.mockResolvedValue([
      {
        muellart: 'Papier',
        abholung: new Date('2026-05-08T00:00:00.000Z'),
      },
    ]);
    mockPrisma.muellplan.create.mockResolvedValue({});
    mockPrisma.benachrichtigungen.create.mockResolvedValue({});

    const result = await service.muellplanPdfBestaetigen(
      7,
      [
        { muellart: 'Papier', farbe: '#00f', abholung: '2026-05-08' },
        { muellart: 'Bio', farbe: '#0f0', abholung: '2026-05-09' },
      ],
      { role: 'admin', employeeId: null },
    );

    expect(result).toEqual({ ok: true, added: 1 });
    expect(mockPrisma.muellplanPdf.updateMany).toHaveBeenCalledWith({
      where: { objekt_id: 7n },
      data: { verified: true },
    });
    expect(mockPrisma.benachrichtigungen.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          typ: 'MOBILE_WASTEPLAN_CONFIRM',
          nachricht: expect.stringContaining('1 Termine'),
        }),
      }),
    );
  });

  it('loads latest waste-plan evidence metadata for an authorized object', async () => {
    mockAccessPolicy.assertCanAccessObject.mockResolvedValue(undefined);
    mockPrisma.muellplanPdf.findFirst.mockResolvedValue({
      id: 9n,
      filename: 'plan.pdf',
      verified: false,
      created_at: new Date('2026-05-08T00:00:00.000Z'),
    });

    const result = await service.muellplanPdfMetadatenLaden(7, {
      role: 'admin',
      employeeId: null,
    });

    expect(result).toEqual(
      expect.objectContaining({ id: 9, filename: 'plan.pdf', verified: false }),
    );
    expect(mockPrisma.muellplanPdf.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { objekt_id: 7n },
        orderBy: { created_at: 'desc' },
      }),
    );
  });
});
