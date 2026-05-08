import { BadRequestException } from '@nestjs/common';
import { TaskStatus, TaskType } from '@prisma/client';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  const prisma = {
    tasks: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    muellplan: { findUnique: jest.fn(), findMany: jest.fn() },
    objekte: { findUnique: jest.fn() },
    mitarbeiter: { findUnique: jest.fn() },
    users: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  let service: TasksService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TasksService(prisma as never);
  });

  it('creates overdue waste-plan tasks for past open pickups', async () => {
    prisma.muellplan.findUnique.mockResolvedValue({
      id: 11n,
      muellart: 'Restmuell',
      abholung: new Date('2020-01-01T00:00:00.000Z'),
      erledigt: false,
      objekte: { id: 7n, kunden_id: 3n },
    });
    prisma.tasks.findUnique.mockResolvedValue(null);
    prisma.tasks.upsert.mockResolvedValue({});

    await service.upsertFromMuellplan(11);

    expect(prisma.tasks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          status: TaskStatus.UEBERFAELLIG,
          type: TaskType.MUELL,
          customer: { connect: { id: 3n } },
        }),
      }),
    );
  });

  it('keeps an existing completion timestamp when a waste-plan pickup stays done', async () => {
    const completedAt = new Date('2026-05-01T10:00:00.000Z');
    prisma.muellplan.findUnique.mockResolvedValue({
      id: 12n,
      muellart: 'Papier',
      abholung: new Date('2026-05-08T00:00:00.000Z'),
      erledigt: true,
      objekte: { id: 8n, kunden_id: null },
    });
    prisma.tasks.findUnique.mockResolvedValue({ completed_at: completedAt });
    prisma.tasks.upsert.mockResolvedValue({});

    await service.upsertFromMuellplan(12, {
      kommentar: 'done',
      fotoUrl: '/uploads/photo.jpg',
    });

    expect(prisma.tasks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          status: TaskStatus.ERLEDIGT,
          completed_at: completedAt,
          customer: { disconnect: true },
          comment: 'done',
          photo_url: '/uploads/photo.jpg',
        }),
      }),
    );
  });

  it('rejects invalid enum filters before querying tasks', async () => {
    await expect(
      service.list({
        page: 1,
        pageSize: 25,
        status: 'OFFEN,INVALID',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
