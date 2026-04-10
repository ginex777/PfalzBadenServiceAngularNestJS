import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Controller('api/mahnungen')
export class MahnungenController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('all')
  async alleGruppiert() {
    const rows = await this.prisma.mahnungen.groupBy({ by: ['rechnung_id'], _count: { id: true } });
    const map: Record<number, number> = {};
    rows.forEach(r => { map[Number(r.rechnung_id)] = r._count.id; });
    return map;
  }

  @Get(':rechnungId')
  async mahnungenLaden(@Param('rechnungId', ParseIntPipe) id: number) {
    const rows = await this.prisma.mahnungen.findMany({ where: { rechnung_id: BigInt(id) }, orderBy: { stufe: 'asc' } });
    return rows.map(m => ({ ...m, id: Number(m.id), rechnung_id: Number(m.rechnung_id), betrag_gebuehr: Number(m.betrag_gebuehr) }));
  }

  @Post()
  async mahnungErstellen(@Body() b: Record<string, unknown>) {
    const m = await this.prisma.mahnungen.create({
      data: {
        rechnung: { connect: { id: BigInt(Number(b['rechnung_id'])) } },
        stufe: Number(b['stufe'] ?? 1),
        datum: new Date(String(b['datum'])),
        betrag_gebuehr: new Prisma.Decimal(Number(b['betrag_gebuehr'] ?? 0)),
        notiz: b['notiz'] ? String(b['notiz']) : null,
      },
    });
    return { ...m, id: Number(m.id), rechnung_id: Number(m.rechnung_id), betrag_gebuehr: Number(m.betrag_gebuehr) };
  }

  @Delete(':id')
  async mahnungLoeschen(@Param('id', ParseIntPipe) id: number) {
    await this.prisma.mahnungen.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }
}
