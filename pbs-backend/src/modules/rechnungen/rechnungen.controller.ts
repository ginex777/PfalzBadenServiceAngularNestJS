import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Headers,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { RechnungenService } from './rechnungen.service';
import { CreateRechnungDto, UpdateRechnungDto } from './dto/rechnung.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Rechnungen')
@ApiSecurity('x-nutzer')
@Roles('admin', 'readonly')
@Controller('api/rechnungen')
export class RechnungenController {
  constructor(private readonly service: RechnungenService) {}

  @Get()
  @ApiOperation({ summary: 'Alle Rechnungen laden' })
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Rechnung erstellen' })
  create(@Body() dto: CreateRechnungDto, @Headers('x-nutzer') nutzer?: string) {
    return this.service.create(dto, nutzer);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Rechnung aktualisieren' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRechnungDto,
    @Headers('x-nutzer') nutzer?: string,
  ) {
    return this.service.update(id, dto, nutzer);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Rechnung löschen' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-nutzer') nutzer?: string,
  ) {
    return this.service.delete(id, nutzer);
  }
}
