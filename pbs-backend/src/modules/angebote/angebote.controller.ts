import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Headers } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { AngeboteService } from './angebote.service';
import { CreateAngebotDto, UpdateAngebotDto } from './dto/angebot.dto';

@ApiTags('Angebote')
@ApiSecurity('x-nutzer')
@Controller('api/angebote')
export class AngeboteController {
  constructor(private readonly service: AngeboteService) {}

  @Get()
  @ApiOperation({ summary: 'Alle Angebote laden' })
  alleAngeboteLaden() { return this.service.alleAngeboteLaden(); }

  @Post()
  @ApiOperation({ summary: 'Angebot erstellen' })
  angebotErstellen(
    @Body() dto: CreateAngebotDto,
    @Headers('x-nutzer') nutzer?: string,
  ) { return this.service.angebotErstellen(dto as unknown as Record<string, unknown>, nutzer); }

  @Put(':id')
  @ApiOperation({ summary: 'Angebot aktualisieren' })
  angebotAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAngebotDto,
    @Headers('x-nutzer') nutzer?: string,
  ) { return this.service.angebotAktualisieren(id, dto as unknown as Record<string, unknown>, nutzer); }

  @Delete(':id')
  @ApiOperation({ summary: 'Angebot löschen' })
  angebotLoeschen(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-nutzer') nutzer?: string,
  ) { return this.service.angebotLoeschen(id, nutzer); }
}
