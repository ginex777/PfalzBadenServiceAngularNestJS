import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { KundenService } from './kunden.service';

@Controller('api/kunden')
export class KundenController {
  constructor(private readonly service: KundenService) {}

  @Get() alleKundenLaden() { return this.service.alleKundenLaden(); }
  @Post() kundeErstellen(@Body() b: Record<string, unknown>) { return this.service.kundeErstellen(b); }
  @Put(':id') kundeAktualisieren(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>) { return this.service.kundeAktualisieren(id, b); }
  @Delete(':id') kundeLoeschen(@Param('id', ParseIntPipe) id: number) { return this.service.kundeLoeschen(id); }
}
