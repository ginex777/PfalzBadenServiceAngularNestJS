import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Headers, Query } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { KundenService } from './kunden.service';
import { CreateKundeDto, UpdateKundeDto } from './dto/kunde.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Kunden')
@ApiSecurity('x-nutzer')
@Controller('api/kunden')
export class KundenController {
  constructor(private readonly service: KundenService) {}

  @Get()
  @ApiOperation({ summary: 'Alle Kunden laden' })
  alleKundenLaden(@Query() pagination: PaginationDto) { return this.service.alleKundenLaden(pagination); }

  @Post()
  @ApiOperation({ summary: 'Kunde erstellen' })
  kundeErstellen(
    @Body() dto: CreateKundeDto,
    @Headers('x-nutzer') nutzer?: string,
  ) { return this.service.kundeErstellen(dto, nutzer); }

  @Put(':id')
  @ApiOperation({ summary: 'Kunde aktualisieren' })
  kundeAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateKundeDto,
    @Headers('x-nutzer') nutzer?: string,
  ) { return this.service.kundeAktualisieren(id, dto, nutzer); }

  @Delete(':id')
  @ApiOperation({ summary: 'Kunde löschen' })
  kundeLoeschen(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-nutzer') nutzer?: string,
  ) { return this.service.kundeLoeschen(id, nutzer); }
}
