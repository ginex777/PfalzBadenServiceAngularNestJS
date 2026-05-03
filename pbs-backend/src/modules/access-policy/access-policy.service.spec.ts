import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AccessPolicyService } from './access-policy.service';
import { PrismaService } from '../../core/database/prisma.service';

const mockPrisma = {
  tasks: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('AccessPolicyService', () => {
  let service: AccessPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessPolicyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AccessPolicyService>(AccessPolicyService);
    jest.clearAllMocks();
  });

  it('allows admins to access every employee', async () => {
    await expect(
      service.assertCanAccessEmployee({ role: 'admin', employeeId: null }, 22),
    ).resolves.toBeUndefined();
  });

  it('rejects employee access to another employee id', async () => {
    await expect(
      service.assertCanAccessEmployee(
        { role: 'mitarbeiter', employeeId: 11 },
        22,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires employee mapping before object-scoped employee access', async () => {
    await expect(
      service.assertCanAccessObject(
        { role: 'mitarbeiter', employeeId: null },
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('checks object access through task assignment for employees', async () => {
    mockPrisma.tasks.count.mockResolvedValue(1);

    await expect(
      service.assertCanAccessObject({ role: 'mitarbeiter', employeeId: 11 }, 7),
    ).resolves.toBeUndefined();

    expect(mockPrisma.tasks.count).toHaveBeenCalledWith({
      where: { object_id: 7n, employee_id: 11n },
    });
  });

  it('returns assigned object ids for employees', async () => {
    mockPrisma.tasks.findMany.mockResolvedValue([
      { object_id: 7n },
      { object_id: 9n },
    ]);

    await expect(
      service.accessibleObjectIds({ role: 'mitarbeiter', employeeId: 11 }),
    ).resolves.toEqual([7n, 9n]);

    expect(mockPrisma.tasks.findMany).toHaveBeenCalledWith({
      where: { employee_id: 11n },
      distinct: ['object_id'],
      select: { object_id: true },
    });
  });
});
