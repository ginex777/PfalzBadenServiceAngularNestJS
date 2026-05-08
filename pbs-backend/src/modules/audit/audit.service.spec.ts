import { AuditService } from './audit.service';

describe('AuditService queries', () => {
  const prisma = {
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: AuditService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuditService(prisma as never);
  });

  it('lists distinct tables', async () => {
    prisma.auditLog.findMany.mockResolvedValue([{ tabelle: 'rechnung' }]);

    await expect(service.listTables()).resolves.toEqual(['rechnung']);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      distinct: ['tabelle'],
      select: { tabelle: true },
      orderBy: { tabelle: 'asc' },
      take: 1000,
    });
  });

  it('returns paginated audit rows with numeric ids', async () => {
    prisma.$transaction.mockResolvedValue([
      [{ id: BigInt(1), datensatz_id: BigInt(2), tabelle: 'rechnung' }],
      1,
    ]);

    await expect(
      service.findAll({ page: 2, pageSize: 10, q: 'rechnung' }),
    ).resolves.toEqual({
      data: [{ id: 1, datensatz_id: 2, tabelle: 'rechnung' }],
      total: 1,
      page: 2,
      pageSize: 10,
    });
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });
});
