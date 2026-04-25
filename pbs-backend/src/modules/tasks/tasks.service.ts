import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TaskStatus, TaskType, Tasks } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  CreateTaskDto,
  TaskListQueryDto,
  UpdateTaskDto,
} from './dto/tasks.dto';

type TaskListItem = {
  id: number;
  title: string;
  type: TaskType;
  status: TaskStatus;
  objectId: number;
  objectName: string;
  customerId: number | null;
  customerName: string | null;
  userId: number | null;
  userEmail: string | null;
  employeeId: number | null;
  employeeName: string | null;
  dueAt: Date | null;
  completedAt: Date | null;
  durationMinutes: number | null;
  comment: string | null;
  photoUrl: string | null;
  source: {
    muellplanId: number | null;
    checklistSubmissionId: number | null;
    timeEntryId: number | null;
  };
  createdAt: Date;
  updatedAt: Date;
};

function parseEnumFilter<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
): T[] | undefined {
  const value = raw?.trim();
  if (!value) return undefined;

  const items = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as string[];

  const allowedSet = new Set<string>(allowed);
  const parsed: T[] = [];
  for (const item of items) {
    if (!allowedSet.has(item)) {
      throw new BadRequestException(`Invalid enum value: ${item}`);
    }
    parsed.push(item as T);
  }
  return parsed.length > 0 ? parsed : undefined;
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: TaskListQueryDto,
  ): Promise<PaginatedResponse<TaskListItem>> {
    const { page, pageSize } = query satisfies PaginationDto;
    const skip = (page - 1) * pageSize;

    const q = query.q?.trim();
    const typeFilter = parseEnumFilter(query.type, Object.values(TaskType));
    const statusFilter = parseEnumFilter(
      query.status,
      Object.values(TaskStatus),
    );

    const whereParts: Prisma.TasksWhereInput[] = [];
    if (q) {
      whereParts.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { comment: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    if (typeof query.objectId === 'number') {
      whereParts.push({ object_id: BigInt(query.objectId) });
    }
    if (typeof query.customerId === 'number') {
      whereParts.push({ customer_id: BigInt(query.customerId) });
    }
    if (typeof query.employeeId === 'number') {
      whereParts.push({ employee_id: BigInt(query.employeeId) });
    }
    if (typeof query.userId === 'number') {
      whereParts.push({ user_id: BigInt(query.userId) });
    }
    if (typeFilter && typeFilter.length > 0) {
      whereParts.push({ type: { in: typeFilter } });
    }
    if (statusFilter && statusFilter.length > 0) {
      whereParts.push({ status: { in: statusFilter } });
    }

    const createdFrom = query.createdFrom ? new Date(query.createdFrom) : null;
    const createdTo = query.createdTo ? new Date(query.createdTo) : null;
    if (createdFrom || createdTo) {
      whereParts.push({
        created_at: {
          gte: createdFrom ?? undefined,
          lte: createdTo ?? undefined,
        },
      });
    }

    const dueFrom = query.dueFrom ? new Date(query.dueFrom) : null;
    const dueTo = query.dueTo ? new Date(query.dueTo) : null;
    if (dueFrom || dueTo) {
      whereParts.push({
        due_at: {
          gte: dueFrom ?? undefined,
          lte: dueTo ?? undefined,
        },
      });
    }

    const where = whereParts.length > 0 ? { AND: whereParts } : undefined;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.tasks.findMany({
        where,
        include: {
          object: {
            select: {
              id: true,
              name: true,
              kunden: { select: { id: true, name: true } },
            },
          },
          customer: { select: { id: true, name: true } },
          user: { select: { id: true, email: true } },
          employee: { select: { id: true, name: true } },
        },
        orderBy: [{ due_at: 'asc' }, { created_at: 'desc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.tasks.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.mapTask(r)),
      total,
      page,
      pageSize,
    };
  }

  async createManual(dto: CreateTaskDto): Promise<TaskListItem> {
    const title = dto.title.trim();
    if (!title) throw new BadRequestException('Title is required');

    const objectRow = await this.prisma.objekte.findUnique({
      where: { id: BigInt(dto.objectId) },
      select: {
        id: true,
        name: true,
        kunden_id: true,
        kunden: { select: { id: true, name: true } },
      },
    });
    if (!objectRow) throw new BadRequestException('Invalid objectId');

    const employeeConnect =
      typeof dto.employeeId === 'number'
        ? await this.ensureEmployeeConnect(dto.employeeId)
        : undefined;

    const userConnect =
      typeof dto.userId === 'number'
        ? await this.ensureUserConnect(dto.userId)
        : undefined;

    const dueAt = dto.dueAt ? new Date(dto.dueAt) : null;

    const created = await this.prisma.tasks.create({
      data: {
        title,
        type: dto.type,
        status: dto.status ?? TaskStatus.OFFEN,
        object: { connect: { id: objectRow.id } },
        customer: objectRow.kunden_id
          ? { connect: { id: objectRow.kunden_id } }
          : undefined,
        ...(employeeConnect ? { employee: employeeConnect } : {}),
        ...(userConnect ? { user: userConnect } : {}),
        due_at: dueAt,
        comment: dto.comment?.trim() ? dto.comment.trim() : null,
        photo_url: dto.photoUrl?.trim() ? dto.photoUrl.trim() : null,
      },
      include: {
        object: {
          select: {
            id: true,
            name: true,
            kunden: { select: { id: true, name: true } },
          },
        },
        customer: { select: { id: true, name: true } },
        user: { select: { id: true, email: true } },
        employee: { select: { id: true, name: true } },
      },
    });

    return this.mapTask(created);
  }

  async update(id: number, dto: UpdateTaskDto): Promise<TaskListItem> {
    const existing = await this.prisma.tasks.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, completed_at: true },
    });
    if (!existing) throw new NotFoundException();

    const employeeUpdate = await this.buildEmployeeUpdate(dto.employeeId);
    const userUpdate = await this.buildUserUpdate(dto.userId);

    const status = dto.status;
    const completedAt =
      dto.completedAt != null
        ? new Date(dto.completedAt)
        : status === TaskStatus.ERLEDIGT
          ? (existing.completed_at ?? new Date())
          : undefined;

    const updated = await this.prisma.tasks.update({
      where: { id: BigInt(id) },
      data: {
        title: dto.title?.trim(),
        type: dto.type,
        status,
        due_at: dto.dueAt != null ? new Date(dto.dueAt) : undefined,
        completed_at: completedAt,
        comment:
          dto.comment != null
            ? dto.comment.trim()
              ? dto.comment.trim()
              : null
            : undefined,
        photo_url:
          dto.photoUrl != null
            ? dto.photoUrl.trim()
              ? dto.photoUrl.trim()
              : null
            : undefined,
        ...(employeeUpdate ?? {}),
        ...(userUpdate ?? {}),
      },
      include: {
        object: {
          select: {
            id: true,
            name: true,
            kunden: { select: { id: true, name: true } },
          },
        },
        customer: { select: { id: true, name: true } },
        user: { select: { id: true, email: true } },
        employee: { select: { id: true, name: true } },
      },
    });

    return this.mapTask(updated);
  }

  async upsertFromMuellplan(
    muellplanId: number,
    extra?: { kommentar?: string; fotoUrl?: string },
  ): Promise<void> {
    const muellRow = await this.prisma.muellplan.findUnique({
      where: { id: BigInt(muellplanId) },
      select: {
        id: true,
        muellart: true,
        abholung: true,
        erledigt: true,
        objekte: { select: { id: true, kunden_id: true } },
      },
    });
    if (!muellRow) return;

    const existing = await this.prisma.tasks.findUnique({
      where: { muellplan_id: muellRow.id },
      select: { completed_at: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const status: TaskStatus = muellRow.erledigt
      ? TaskStatus.ERLEDIGT
      : muellRow.abholung.getTime() < today.getTime()
        ? TaskStatus.UEBERFAELLIG
        : TaskStatus.OFFEN;

    const completedAt = muellRow.erledigt
      ? (existing?.completed_at ?? new Date())
      : null;

    await this.prisma.tasks.upsert({
      where: { muellplan_id: muellRow.id },
      update: {
        title: `Muelltermin: ${muellRow.muellart}`,
        type: TaskType.MUELL,
        status,
        due_at: muellRow.abholung,
        completed_at: completedAt,
        object: { connect: { id: muellRow.objekte.id } },
        customer: muellRow.objekte.kunden_id
          ? { connect: { id: muellRow.objekte.kunden_id } }
          : { disconnect: true },
        ...(extra?.kommentar !== undefined ? { comment: extra.kommentar } : {}),
        ...(extra?.fotoUrl !== undefined ? { photo_url: extra.fotoUrl } : {}),
      },
      create: {
        title: `Muelltermin: ${muellRow.muellart}`,
        type: TaskType.MUELL,
        status,
        due_at: muellRow.abholung,
        completed_at: completedAt,
        object: { connect: { id: muellRow.objekte.id } },
        customer: muellRow.objekte.kunden_id
          ? { connect: { id: muellRow.objekte.kunden_id } }
          : undefined,
        muellplan_id: muellRow.id,
        comment: extra?.kommentar ?? null,
        photo_url: extra?.fotoUrl ?? null,
      },
    });
  }

  async deleteByMuellplanId(muellplanId: number): Promise<void> {
    await this.prisma.tasks.deleteMany({
      where: { muellplan_id: BigInt(muellplanId) },
    });
  }

  async upsertFromChecklistSubmission(submissionId: number): Promise<void> {
    const submissionRow = await this.prisma.checklistenSubmissions.findUnique({
      where: { id: BigInt(submissionId) },
      select: {
        id: true,
        submitted_at: true,
        note: true,
        mitarbeiter_id: true,
        template: { select: { name: true } },
        objekt: { select: { id: true, kunden_id: true } },
      },
    });
    if (!submissionRow) return;

    await this.prisma.tasks.upsert({
      where: { checklist_submission_id: submissionRow.id },
      update: {
        title: `Checkliste: ${submissionRow.template.name}`,
        type: TaskType.CHECKLISTE,
        status: TaskStatus.ERLEDIGT,
        due_at: submissionRow.submitted_at,
        completed_at: submissionRow.submitted_at,
        comment: submissionRow.note ?? null,
        object: { connect: { id: submissionRow.objekt.id } },
        customer: submissionRow.objekt.kunden_id
          ? { connect: { id: submissionRow.objekt.kunden_id } }
          : { disconnect: true },
        employee: submissionRow.mitarbeiter_id
          ? { connect: { id: submissionRow.mitarbeiter_id } }
          : { disconnect: true },
      },
      create: {
        title: `Checkliste: ${submissionRow.template.name}`,
        type: TaskType.CHECKLISTE,
        status: TaskStatus.ERLEDIGT,
        due_at: submissionRow.submitted_at,
        completed_at: submissionRow.submitted_at,
        comment: submissionRow.note ?? null,
        object: { connect: { id: submissionRow.objekt.id } },
        customer: submissionRow.objekt.kunden_id
          ? { connect: { id: submissionRow.objekt.kunden_id } }
          : undefined,
        employee: submissionRow.mitarbeiter_id
          ? { connect: { id: submissionRow.mitarbeiter_id } }
          : undefined,
        checklist_submission_id: submissionRow.id,
      },
    });
  }

  async upsertFromTimeEntry(timeEntryId: number): Promise<void> {
    const row = await this.prisma.stempel.findUnique({
      where: { id: BigInt(timeEntryId) },
      select: {
        id: true,
        mitarbeiter_id: true,
        objekt_id: true,
        stop: true,
        dauer_minuten: true,
        notiz: true,
        objekte: { select: { id: true, kunden_id: true } },
      },
    });
    if (!row || !row.stop || !row.objekte) return;

    const title =
      row.dauer_minuten != null
        ? `Zeiterfassung: ${row.dauer_minuten} min`
        : 'Zeiterfassung';

    await this.prisma.tasks.upsert({
      where: { stempel_id: row.id },
      update: {
        title,
        type: TaskType.ZEITERFASSUNG,
        status: TaskStatus.ERLEDIGT,
        due_at: row.stop,
        completed_at: row.stop,
        duration_minutes: row.dauer_minuten,
        comment: row.notiz ?? null,
        object: { connect: { id: row.objekte.id } },
        customer: row.objekte.kunden_id
          ? { connect: { id: row.objekte.kunden_id } }
          : { disconnect: true },
        employee: { connect: { id: row.mitarbeiter_id } },
      },
      create: {
        title,
        type: TaskType.ZEITERFASSUNG,
        status: TaskStatus.ERLEDIGT,
        due_at: row.stop,
        completed_at: row.stop,
        duration_minutes: row.dauer_minuten,
        comment: row.notiz ?? null,
        object: { connect: { id: row.objekte.id } },
        customer: row.objekte.kunden_id
          ? { connect: { id: row.objekte.kunden_id } }
          : undefined,
        employee: { connect: { id: row.mitarbeiter_id } },
        stempel_id: row.id,
      },
    });
  }

  async syncMuellplanTasks(params?: {
    daysBack?: number;
    daysForward?: number;
  }): Promise<void> {
    const daysBack = params?.daysBack ?? 7;
    const daysForward = params?.daysForward ?? 45;

    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - daysBack);

    const to = new Date();
    to.setHours(0, 0, 0, 0);
    to.setDate(to.getDate() + daysForward);

    const rows = await this.prisma.muellplan.findMany({
      where: { abholung: { gte: from, lte: to } },
      select: { id: true },
      orderBy: { abholung: 'asc' },
      take: 5000,
    });

    for (const row of rows) {
      await this.upsertFromMuellplan(Number(row.id));
    }
  }

  private mapTask(
    row: Tasks & {
      object: {
        id: bigint;
        name: string;
        kunden: { id: bigint; name: string } | null;
      };
      customer: { id: bigint; name: string } | null;
      user: { id: bigint; email: string } | null;
      employee: { id: bigint; name: string } | null;
    },
  ): TaskListItem {
    const customerFromObject = row.object.kunden;
    const customer = row.customer ?? customerFromObject;

    return {
      id: Number(row.id),
      title: row.title,
      type: row.type,
      status: row.status,
      objectId: Number(row.object_id),
      objectName: row.object.name,
      customerId: customer ? Number(customer.id) : null,
      customerName: customer?.name ?? null,
      userId: row.user_id ? Number(row.user_id) : null,
      userEmail: row.user?.email ?? null,
      employeeId: row.employee_id ? Number(row.employee_id) : null,
      employeeName: row.employee?.name ?? null,
      dueAt: row.due_at ?? null,
      completedAt: row.completed_at ?? null,
      durationMinutes: row.duration_minutes ?? null,
      comment: row.comment ?? null,
      photoUrl: row.photo_url ?? null,
      source: {
        muellplanId: row.muellplan_id ? Number(row.muellplan_id) : null,
        checklistSubmissionId: row.checklist_submission_id
          ? Number(row.checklist_submission_id)
          : null,
        timeEntryId: row.stempel_id ? Number(row.stempel_id) : null,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async ensureEmployeeConnect(
    employeeId: number,
  ): Promise<{ connect: { id: bigint } }> {
    const exists = await this.prisma.mitarbeiter.findUnique({
      where: { id: BigInt(employeeId) },
      select: { id: true },
    });
    if (!exists) throw new BadRequestException('Invalid employeeId');
    return { connect: { id: exists.id } };
  }

  private async ensureUserConnect(
    userId: number,
  ): Promise<{ connect: { id: bigint } }> {
    const exists = await this.prisma.users.findUnique({
      where: { id: BigInt(userId) },
      select: { id: true },
    });
    if (!exists) throw new BadRequestException('Invalid userId');
    return { connect: { id: exists.id } };
  }

  private async buildEmployeeUpdate(
    employeeId: number | null | undefined,
  ): Promise<
    | { employee?: { connect: { id: bigint } } | { disconnect: true } }
    | undefined
  > {
    if (employeeId === undefined) return undefined;
    if (employeeId === null) return { employee: { disconnect: true } };
    return { employee: await this.ensureEmployeeConnect(employeeId) };
  }

  private async buildUserUpdate(
    userId: number | null | undefined,
  ): Promise<
    { user?: { connect: { id: bigint } } | { disconnect: true } } | undefined
  > {
    if (userId === undefined) return undefined;
    if (userId === null) return { user: { disconnect: true } };
    return { user: await this.ensureUserConnect(userId) };
  }
}
