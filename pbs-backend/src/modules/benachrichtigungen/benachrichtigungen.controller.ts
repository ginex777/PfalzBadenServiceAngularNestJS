import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Controller('api/benachrichtigungen')
export class BenachrichtigungenController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll() {
    const rows = await this.prisma.benachrichtigungen.findMany({
      where: { gelesen: false },
      orderBy: { erstellt_am: 'desc' },
      take: 50,
    });
    return rows.map((b) => ({ ...b, id: Number(b.id) }));
  }

  @Post('alle-lesen')
  async markAllRead() {
    await this.prisma.benachrichtigungen.updateMany({
      where: { gelesen: false },
      data: { gelesen: true },
    });
    return { ok: true };
  }

  @Post(':id/lesen')
  async markRead(@Param('id', ParseIntPipe) id: number) {
    await this.prisma.benachrichtigungen.update({
      where: { id: BigInt(id) },
      data: { gelesen: true },
    });
    return { ok: true };
  }
}
