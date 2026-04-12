import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Headers } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { KundenService } from './kunden.service';
import { CreateKundeDto, UpdateKundeDto } from './dto/kunde.dto';

@ApiTags('Kunden')
@ApiSecurity('x-nutzer')
@Controller('api/kunden')
export class KundenController {
  constructor(private readonly service: KundenService) {}

  @Get()
  @ApiOperation({ summary: 'Alle Kunden laden' })
  alleKundenLaden() { return this.service.alleKundenLaden(); }

  @Post()
  @ApiOperation({ summary: 'Kunde erstellen' })
  kundeErstellen(
    @Body() dto: CreateKundeDto,
    @Headers('x-nutzer') nutzer?: string,
  ) { return this.service.kundeErstellen(dto as unknown as Record<string, unknown>, nutzer); }

  @Put(':id')
  @ApiOperation({ summary: 'Kunde aktualisieren' })
  kundeAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateKundeDto,
    @Headers('x-nutzer') nutzer?: string,
  ) { return this.service.kundeAktualisieren(id, dto as unknown as Record<string, unknown>, nutzer); }

  @Delete(':id')
  @ApiOperation({ summary: 'Kunde löschen' })
  kundeLoeschen(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-nutzer') nutzer?: string,
  ) { return this.service.kundeLoeschen(id, nutzer); }
}
