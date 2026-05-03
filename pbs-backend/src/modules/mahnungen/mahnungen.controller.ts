import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { MahnungenService } from './mahnungen.service';
import type { CreateMahnungDto } from './dto/mahnung.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { AllowReadonlyWrite } from '../auth/decorators/allow-readonly-write.decorator';

@ApiTags('Mahnungen')
@Roles('admin', 'readonly')
@Controller('api/mahnungen')
export class MahnungenController {
  constructor(private readonly service: MahnungenService) {}

  @Get('all')
  @ApiOperation({ summary: 'Alle Mahnungen gruppiert nach Rechnung' })
  findAllGrouped() {
    return this.service.findAllGrouped();
  }

  @Get(':rechnungId')
  @ApiOperation({ summary: 'Mahnungen für eine Rechnung laden' })
  findByInvoice(@Param('rechnungId', ParseIntPipe) id: number) {
    return this.service.findByInvoice(id);
  }

  @Post()
  @ApiOperation({ summary: 'Mahnung erstellen' })
  create(@Body() dto: CreateMahnungDto) {
    return this.service.create(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Mahnung löschen' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }

  @Post(':id/pdf')
  @ApiOperation({ summary: 'Mahnung-PDF erstellen' })
  @AllowReadonlyWrite()
  createPdf(@Param('id', ParseIntPipe) id: number) {
    return this.service.createPdf(id);
  }
}
