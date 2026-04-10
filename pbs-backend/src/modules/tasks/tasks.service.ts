import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async alleTasksLaden() {
    const rows = await this.prisma.tasks.findMany({ orderBy: [{ status: 'asc' }, { position: 'asc' }, { id: 'asc' }] });
    return rows.map(t => ({ ...t, id: Number(t.id) }));
  }

  async taskErstellen(d: Record<string, unknown>) {
    const maxPos = await this.prisma.tasks.aggregate({ where: { status: String(d['status'] ?? 'todo') }, _max: { position: true } });
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
    if (!await this.prisma.tasks.findUnique({ where: { id: BigInt(id) } })) throw new NotFoundException();
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
    if (!await this.prisma.tasks.findUnique({ where: { id: BigInt(id) } })) throw new NotFoundException();
    await this.prisma.tasks.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }

  async tasksNeuAnordnen(updates: { id: number; status: string; position: number }[]) {
    await this.prisma.$transaction(
      updates.map(u => this.prisma.tasks.update({ where: { id: BigInt(u.id) }, data: { status: u.status, position: u.position } }))
    );
    return { ok: true };
  }
}
