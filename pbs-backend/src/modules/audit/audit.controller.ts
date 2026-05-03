import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import type { PrismaService } from '../../core/database/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuditListQueryDto } from './dto/audit-list-query.dto';

@Roles('admin', 'readonly')
@Controller('api/audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('tables')
  async listTables() {
    const rows = await this.prisma.auditLog.findMany({
      distinct: ['tabelle'],
      select: { tabelle: true },
      orderBy: { tabelle: 'asc' },
      take: 1000,
    });
    return rows.map((r) => r.tabelle);
  }

  @Get('all')
  async findAll(@Query() query: AuditListQueryDto) {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;
    const q = query.q?.trim();
    const aktion = query.aktion?.trim();
    const tabelle = query.tabelle?.trim();
    const where =
      q || aktion || tabelle
        ? {
            AND: [
              aktion ? { aktion } : {},
              tabelle ? { tabelle } : {},
              q
                ? {
                    OR: [
                      {
                        tabelle: { contains: q, mode: 'insensitive' as const },
                      },
                      { nutzer: { contains: q, mode: 'insensitive' as const } },
                      {
                        nutzer_name: {
                          contains: q,
                          mode: 'insensitive' as const,
                        },
                      },
                    ],
                  }
                : {},
            ],
          }
        : undefined;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { zeitstempel: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      data: rows.map((r) => ({
        ...r,
        id: Number(r.id),
        datensatz_id: Number(r.datensatz_id),
      })),
      total,
      page,
      pageSize,
    };
  }

  @Get(':tabelle/all')
  async findByTable(
    @Param('tabelle') tabelle: string,
    @Query() query: AuditListQueryDto,
  ) {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;
    const q = query.q?.trim();
    const aktion = query.aktion?.trim();
    const where =
      q || aktion
        ? {
            AND: [
              { tabelle },
              aktion ? { aktion } : {},
              q
                ? {
                    OR: [
                      { nutzer: { contains: q, mode: 'insensitive' as const } },
                      {
                        nutzer_name: {
                          contains: q,
                          mode: 'insensitive' as const,
                        },
                      },
                    ],
                  }
                : {},
            ],
          }
        : { tabelle };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { zeitstempel: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      data: rows.map((r) => ({
        ...r,
        id: Number(r.id),
        datensatz_id: Number(r.datensatz_id),
      })),
      total,
      page,
      pageSize,
    };
  }

  @Get(':tabelle/:id')
  async findByRecord(
    @Param('tabelle') tabelle: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const rows = await this.prisma.auditLog.findMany({
      where: { tabelle, datensatz_id: BigInt(id) },
      orderBy: { zeitstempel: 'desc' },
      take: 200,
    });
    return rows.map((r) => ({
      ...r,
      id: Number(r.id),
      datensatz_id: Number(r.datensatz_id),
    }));
  }
}
