import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ObjekteService } from './objekte.service';
import { PrismaService } from '../../core/database/prisma.service';
import { AccessPolicyService } from '../access-policy/access-policy.service';

const mockPrisma = {
  objekte: {
    findMany: jest.fn(),
  },
};

const mockAccessPolicy = {
  objectWhereForAuth: jest.fn(),
};

describe('ObjekteService', () => {
  let service: ObjekteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObjekteService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AccessPolicyService, useValue: mockAccessPolicy },
      ],
    }).compile();

    service = module.get<ObjekteService>(ObjekteService);
    jest.clearAllMocks();
  });

  it('uses access policy filters for unpaginated object selection', async () => {
    const where = { tasks: { some: { employee_id: 11n } } };
    mockAccessPolicy.objectWhereForAuth.mockReturnValue(where);
    mockPrisma.objekte.findMany.mockResolvedValue([]);

    await service.findAllUnpaginated(undefined, {
      role: 'mitarbeiter',
      employeeId: 11,
    });

    expect(mockAccessPolicy.objectWhereForAuth).toHaveBeenCalledWith(
      { role: 'mitarbeiter', employeeId: 11 },
      undefined,
    );
    expect(mockPrisma.objekte.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where }),
    );
  });
});
