import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async alleTasksLaden(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.tasks.findMany({
        orderBy: [{ status: 'asc' }, { position: 'asc' }, { id: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.tasks.count(),
    ]);
    return {
      data: rows.map((t) => ({ ...t, id: Number(t.id) })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async taskErstellen(d: Record<string, unknown>) {
    const maxPos = await this.prisma.tasks.aggregate({
      where: { status: String(d['status'] ?? 'todo') },
      _max: { position: true },
    });
    const t = await this.prisma.tasks.create({
      data: {
        titel: String(d['titel'] ?? ''),
        beschreibung: d['beschreibung'] ? String(d['beschreibung']) : null,
        datum: d['datum'] ? new Date(String(d['datum'])) : null,
        bearbeiter: d['bearbeiter'] ? String(d['bearbeiter']) : null,
        kategorie: d['kategorie'] ? String(d['kategorie']) : 'Sonstiges',
        status: String(d['status'] ?? 'todo'),
        prioritaet: String(d['prioritaet'] ?? 'mittel'),
        position: (maxPos._max.position ?? -1) + 1,
      },
    });
    return { ...t, id: Number(t.id) };
  }

  async taskAktualisieren(id: number, d: Record<string, unknown>) {
    if (!(await this.prisma.tasks.findUnique({ where: { id: BigInt(id) } })))
      throw new NotFoundException();
    const t = await this.prisma.tasks.update({
      where: { id: BigInt(id) },
      data: {
        titel: String(d['titel'] ?? ''),
        beschreibung: d['beschreibung'] ? String(d['beschreibung']) : null,
        datum: d['datum'] ? new Date(String(d['datum'])) : null,
        bearbeiter: d['bearbeiter'] ? String(d['bearbeiter']) : null,
        kategorie: d['kategorie'] ? String(d['kategorie']) : 'Sonstiges',
        status: String(d['status'] ?? 'todo'),
        prioritaet: String(d['prioritaet'] ?? 'mittel'),
        position: Number(d['position'] ?? 0),
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

  async tasksNeuAnordnen(
    updates: { id: number; status: string; position: number }[],
  ) {
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
