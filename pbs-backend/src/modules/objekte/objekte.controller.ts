import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import type { ObjekteService } from './objekte.service';
import type { AuthRequest } from '../auth/auth-request.type';
import type {
  AktivitaetenQueryDto,
  CreateObjektDto,
  ListObjekteQueryDto,
  UpdateObjektDto,
} from './dto/objekte.dto';

@ApiTags('Objekte')
@ApiSecurity('x-nutzer')
@Roles('admin', 'readonly')
@Controller('api/objekte')
export class ObjekteController {
  constructor(private readonly service: ObjekteService) {}

  @Get()
  @ApiOperation({ summary: 'Alle Objekte laden' })
  findAll(@Query() query: ListObjekteQueryDto) {
    return this.service.findAll(query, query.q, query.customerId);
  }

  @Get('all')
  @ApiOperation({ summary: 'Alle Objekte (unpaginated) laden' })
  @Roles('admin', 'readonly', 'mitarbeiter')
  findAllUnpaginated(
    @Query() query: ListObjekteQueryDto,
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.findAllUnpaginated(query.customerId, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }

  @Get(':id/aktivitaeten')
  @ApiOperation({ summary: 'Aktivitäten für Objekt laden' })
  getAktivitaeten(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AktivitaetenQueryDto,
  ) {
    return this.service.getAktivitaeten(id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Objekt erstellen' })
  @Roles('admin')
  create(@Body() dto: CreateObjektDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Objekt aktualisieren' })
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateObjektDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Objekt löschen/deaktivieren' })
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
