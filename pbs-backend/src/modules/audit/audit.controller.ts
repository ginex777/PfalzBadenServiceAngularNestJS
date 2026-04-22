import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin', 'readonly')
@Controller('api/audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('all')
  async findAll(@Query() pagination: PaginationDto) {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        orderBy: { zeitstempel: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auditLog.count(),
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
    @Query() pagination: PaginationDto,
  ) {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const where = { tabelle };
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
    });
    return rows.map((r) => ({
      ...r,
      id: Number(r.id),
      datensatz_id: Number(r.datensatz_id),
    }));
  }
}
