import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MahnungenService } from './mahnungen.service';
import { CreateMahnungDto } from './dto/mahnung.dto';

@ApiTags('Mahnungen')
@Controller('api/mahnungen')
export class MahnungenController {
  constructor(private readonly service: MahnungenService) {}

  @Get('all')
  @ApiOperation({ summary: 'Alle Mahnungen gruppiert nach Rechnung' })
  alleGruppiert() { return this.service.alleGruppiert(); }

  @Get(':rechnungId')
  @ApiOperation({ summary: 'Mahnungen für eine Rechnung laden' })
  mahnungenLaden(@Param('rechnungId', ParseIntPipe) id: number) { return this.service.mahnungenLaden(id); }

  @Post()
  @ApiOperation({ summary: 'Mahnung erstellen' })
  mahnungErstellen(@Body() dto: CreateMahnungDto) { return this.service.mahnungErstellen(dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Mahnung löschen' })
  mahnungLoeschen(@Param('id', ParseIntPipe) id: number) { return this.service.mahnungLoeschen(id); }

  @Post(':id/pdf')
  @ApiOperation({ summary: 'Mahnung-PDF erstellen' })
  mahnungPdfErstellen(@Param('id', ParseIntPipe) id: number) { return this.service.mahnungPdfErstellen(id); }
}
