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
    update: jest.fn(),
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
});
