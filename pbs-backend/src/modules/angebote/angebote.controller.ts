import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { AngeboteService } from './angebote.service';

@Controller('api/angebote')
export class AngeboteController {
  constructor(private readonly service: AngeboteService) {}

  @Get() alleAngeboteLaden() { return this.service.alleAngeboteLaden(); }
  @Post() angebotErstellen(@Body() b: Record<string, unknown>) { return this.service.angebotErstellen(b); }
  @Put(':id') angebotAktualisieren(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>) { return this.service.angebotAktualisieren(id, b); }
  @Delete(':id') angebotLoeschen(@Param('id', ParseIntPipe) id: number) { return this.service.angebotLoeschen(id); }
}
