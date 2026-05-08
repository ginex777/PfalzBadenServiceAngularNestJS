import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuditListQueryDto } from './dto/audit-list-query.dto';
import { AuditService } from './audit.service';

@Roles('admin', 'readonly')
@Controller('api/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('tables')
  async listTables() {
    return this.auditService.listTables();
  }

  @Get('all')
  async findAll(@Query() query: AuditListQueryDto) {
    return this.auditService.findAll(query);
  }

  @Get(':tabelle/all')
  async findByTable(
    @Param('tabelle') tabelle: string,
    @Query() query: AuditListQueryDto,
  ) {
    return this.auditService.findByTable(tabelle, query);
  }

  @Get(':tabelle/:id')
  async findByRecord(
    @Param('tabelle') tabelle: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.auditService.findByRecord(tabelle, id);
  }
}
