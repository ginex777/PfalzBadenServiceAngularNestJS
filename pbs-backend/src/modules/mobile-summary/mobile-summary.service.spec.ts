import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { MobileSummaryService } from './mobile-summary.service';
import { PrismaService } from '../../core/database/prisma.service';
import { AccessPolicyService } from '../access-policy/access-policy.service';

const mockPrisma = {
  stempel: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  muellplan: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

const mockAccessPolicy = {
  assertCanAccessObject: jest.fn(),
  accessibleObjectIds: jest.fn(),
  requireEmployeeMapping: jest.fn(),
};

describe('MobileSummaryService', () => {
  let service: MobileSummaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MobileSummaryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AccessPolicyService, useValue: mockAccessPolicy },
      ],
    }).compile();

    service = module.get<MobileSummaryService>(MobileSummaryService);
    jest.clearAllMocks();
  });

  it('builds selected-object dashboard truth from backend state', async () => {
    const today = new Date();
    today.setHours(8, 0, 0, 0);
    const dateOnly = new Date(today);
    dateOnly.setHours(0, 0, 0, 0);

    mockAccessPolicy.accessibleObjectIds.mockResolvedValue([7n]);
    mockPrisma.stempel.findFirst.mockResolvedValue({
      id: 21n,
      mitarbeiter_id: 11n,
      objekt_id: 7n,
      start: today,
      stop: null,
      dauer_minuten: null,
      notiz: 'Start',
    });
    mockPrisma.stempel.findMany.mockResolvedValue([
      {
        id: 20n,
        mitarbeiter_id: 11n,
        objekt_id: 7n,
        start: today,
        stop: new Date(today.getTime() + 60 * 60 * 1000),
        dauer_minuten: 60,
        notiz: null,
      },
    ]);
    mockPrisma.muellplan.findMany.mockResolvedValue([
      {
        id: 31n,
        objekt_id: 7n,
        muellart: 'Papier',
        farbe: '#2563eb',
        abholung: dateOnly,
        erledigt: false,
        objekte: { name: 'Objekt A' },
      },
    ]);
    mockPrisma.muellplan.count.mockResolvedValue(1);

    const summary = await service.dashboardSummary({
      auth: { role: 'mitarbeiter', employeeId: 11 },
      objectId: 7,
      pickupLimit: 6,
    });

    expect(mockAccessPolicy.assertCanAccessObject).toHaveBeenCalledWith(
      { role: 'mitarbeiter', employeeId: 11 },
      7,
    );
    expect(summary).toMatchObject({
      scope: 'selected-object',
      objectId: 7,
      openPointsCount: 2,
      activeStampStatus: 'active',
      totalTrackedMinutes: 60,
      upcomingPickups: [
        expect.objectContaining({
          id: 31,
          objekt_id: 7,
          isToday: true,
          isDue: true,
        }),
      ],
    });
  });

  it('uses assigned objects when no object is selected', async () => {
    mockAccessPolicy.accessibleObjectIds.mockResolvedValue([7n, 9n]);
    mockPrisma.stempel.findFirst.mockResolvedValue(null);
    mockPrisma.stempel.findMany.mockResolvedValue([]);
    mockPrisma.muellplan.findMany.mockResolvedValue([]);
    mockPrisma.muellplan.count.mockResolvedValue(0);

    await service.dashboardSummary({
      auth: { role: 'mitarbeiter', employeeId: 11 },
      objectId: null,
      pickupLimit: 6,
    });

    expect(mockPrisma.muellplan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ objekt_id: { in: [7n, 9n] } }),
      }),
    );
  });
});
