import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  CreateTaskDto,
  TaskReorderUpdateDto,
  UpdateTaskDto,
} from './dto/task.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async alleTasksLaden(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.tasks.findMany({
        orderBy: [{ status: 'asc' }, { position: 'asc' }, { id: 'asc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.tasks.count(),
    ]);
    return {
      data: rows.map((t) => ({ ...t, id: Number(t.id) })),
      total,
      page,
      pageSize,
    };
  }

  async taskErstellen(d: CreateTaskDto) {
    const maxPos = await this.prisma.tasks.aggregate({
      where: { status: d.status ?? 'todo' },
      _max: { position: true },
    });
    const t = await this.prisma.tasks.create({
      data: {
        titel: d.titel,
        beschreibung: d.beschreibung ?? null,
        datum: d.datum ? new Date(d.datum) : null,
        bearbeiter: d.bearbeiter ?? null,
        kategorie: d.kategorie ?? 'Sonstiges',
        status: d.status ?? 'todo',
        prioritaet: d.prioritaet ?? 'mittel',
        position: (maxPos._max.position ?? -1) + 1,
      },
    });
    return { ...t, id: Number(t.id) };
  }

  async taskAktualisieren(id: number, d: UpdateTaskDto) {
    if (!(await this.prisma.tasks.findUnique({ where: { id: BigInt(id) } })))
      throw new NotFoundException();
    const t = await this.prisma.tasks.update({
      where: { id: BigInt(id) },
      data: {
        titel: d.titel,
        beschreibung: d.beschreibung ?? null,
        datum: d.datum ? new Date(d.datum) : null,
        bearbeiter: d.bearbeiter ?? null,
        kategorie: d.kategorie ?? 'Sonstiges',
        status: d.status ?? 'todo',
        prioritaet: d.prioritaet ?? 'mittel',
        position: d.position ?? 0,
      },
    });
    return { ...t, id: Number(t.id) };
  }

  async taskLoeschen(id: number) {
    if (!(await this.prisma.tasks.findUnique({ where: { id: BigInt(id) } })))
      throw new NotFoundException();
    await this.prisma.tasks.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }

  async tasksNeuAnordnen(updates: TaskReorderUpdateDto[]) {
    await this.prisma.$transaction(
      updates.map((u) =>
        this.prisma.tasks.update({
          where: { id: BigInt(u.id) },
          data: { status: u.status, position: u.position },
        }),
      ),
    );
    return { ok: true };
  }
}
