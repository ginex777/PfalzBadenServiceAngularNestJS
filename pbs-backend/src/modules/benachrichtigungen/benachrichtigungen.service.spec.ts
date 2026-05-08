import { BenachrichtigungenService } from './benachrichtigungen.service';

describe('BenachrichtigungenService', () => {
  const prisma = {
    benachrichtigungen: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: BenachrichtigungenService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BenachrichtigungenService(prisma as never);
  });

  it('lists unread notifications with numeric ids', async () => {
    prisma.benachrichtigungen.findMany.mockResolvedValue([
      { id: BigInt(7), titel: 'Test', gelesen: false },
    ]);

    await expect(service.findUnread()).resolves.toEqual([
      { id: 7, titel: 'Test', gelesen: false },
    ]);
    expect(prisma.benachrichtigungen.findMany).toHaveBeenCalledWith({
      where: { gelesen: false },
      orderBy: { erstellt_am: 'desc' },
      take: 50,
    });
  });

  it('marks a single notification as read', async () => {
    prisma.benachrichtigungen.update.mockResolvedValue({});

    await expect(service.markRead(3)).resolves.toEqual({ ok: true });
    expect(prisma.benachrichtigungen.update).toHaveBeenCalledWith({
      where: { id: BigInt(3) },
      data: { gelesen: true },
    });
  });
});
