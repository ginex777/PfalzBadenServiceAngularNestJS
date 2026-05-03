import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { HausmeisterService } from './hausmeister.service';
import { PrismaService } from '../../core/database/prisma.service';
import { AccessPolicyService } from '../access-policy/access-policy.service';

const mockPrisma = {};
const mockAccessPolicy = {
  assertCanAccessEmployee: jest.fn(),
};

describe('HausmeisterService', () => {
  let service: HausmeisterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HausmeisterService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AccessPolicyService, useValue: mockAccessPolicy },
      ],
    }).compile();

    service = module.get<HausmeisterService>(HausmeisterService);
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('checks employee authorization before loading employee hausmeister entries', async () => {
    mockAccessPolicy.assertCanAccessEmployee.mockRejectedValue(
      new Error('blocked'),
    );

    await expect(
      service.einsaetzeFuerMitarbeiterLaden(22, {
        role: 'mitarbeiter',
        employeeId: 11,
      }),
    ).rejects.toThrow('blocked');

    expect(mockAccessPolicy.assertCanAccessEmployee).toHaveBeenCalledWith(
      { role: 'mitarbeiter', employeeId: 11 },
      22,
    );
  });
});
