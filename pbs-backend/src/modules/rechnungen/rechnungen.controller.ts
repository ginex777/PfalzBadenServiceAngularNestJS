import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Headers } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { RechnungenService } from './rechnungen.service';
import { CreateRechnungDto, UpdateRechnungDto } from './dto/rechnung.dto';

@ApiTags('Rechnungen')
@ApiSecurity('x-nutzer')
@Controller('api/rechnungen')
export class RechnungenController {
  constructor(private readonly service: RechnungenService) {}

  @Get()
  @ApiOperation({ summary: 'Alle Rechnungen laden' })
  alleRechnungenLaden() { return this.service.alleRechnungenLaden(); }

  @Post()
  @ApiOperation({ summary: 'Rechnung erstellen' })
  rechnungErstellen(
    @Body() dto: CreateRechnungDto,
    @Headers('x-nutzer') nutzer?: string,
  ) { return this.service.rechnungErstellen(dto as unknown as Record<string, unknown>, nutzer); }

  @Put(':id')
  @ApiOperation({ summary: 'Rechnung aktualisieren' })
  rechnungAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRechnungDto,
    @Headers('x-nutzer') nutzer?: string,
  ) { return this.service.rechnungAktualisieren(id, dto as unknown as Record<string, unknown>, nutzer); }

  @Delete(':id')
  @ApiOperation({ summary: 'Rechnung löschen' })
  rechnungLoeschen(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-nutzer') nutzer?: string,
  ) { return this.service.rechnungLoeschen(id, nutzer); }
}
