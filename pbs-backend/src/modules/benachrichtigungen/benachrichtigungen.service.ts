import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class BenachrichtigungenService {
  constructor(private readonly prisma: PrismaService) {}

  async findUnread() {
    const rows = await this.prisma.benachrichtigungen.findMany({
      where: { gelesen: false },
      orderBy: { erstellt_am: 'desc' },
      take: 50,
    });
    return rows.map((notification) => ({
      ...notification,
      id: Number(notification.id),
    }));
  }

  async markAllRead() {
    await this.prisma.benachrichtigungen.updateMany({
      where: { gelesen: false },
      data: { gelesen: true },
    });
    return { ok: true };
  }

  async markRead(id: number) {
    await this.prisma.benachrichtigungen.update({
      where: { id: BigInt(id) },
      data: { gelesen: true },
    });
    return { ok: true };
  }
}
