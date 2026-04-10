import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Controller('api/audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('all')
  async alleEintraegeAbrufen() {
    const rows = await this.prisma.auditLog.findMany({ orderBy: { zeitstempel: 'desc' }, take: 500 });
    return rows.map(r => ({ ...r, id: Number(r.id), datensatz_id: Number(r.datensatz_id) }));
  }

  @Get(':tabelle/all')
  async eintraegeFuerTabelle(@Param('tabelle') tabelle: string) {
    const rows = await this.prisma.auditLog.findMany({ where: { tabelle }, orderBy: { zeitstempel: 'desc' }, take: 200 });
    return rows.map(r => ({ ...r, id: Number(r.id), datensatz_id: Number(r.datensatz_id) }));
  }

  @Get(':tabelle/:id')
  async eintraegeFuerDatensatz(@Param('tabelle') tabelle: string, @Param('id', ParseIntPipe) id: number) {
    const rows = await this.prisma.auditLog.findMany({ where: { tabelle, datensatz_id: BigInt(id) }, orderBy: { zeitstempel: 'desc' } });
    return rows.map(r => ({ ...r, id: Number(r.id), datensatz_id: Number(r.datensatz_id) }));
  }
}
