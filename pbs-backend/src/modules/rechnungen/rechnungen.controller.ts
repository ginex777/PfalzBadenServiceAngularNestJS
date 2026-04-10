import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { RechnungenService } from './rechnungen.service';

@Controller('api/rechnungen')
export class RechnungenController {
  constructor(private readonly service: RechnungenService) {}

  @Get() alleRechnungenLaden() { return this.service.alleRechnungenLaden(); }
  @Post() rechnungErstellen(@Body() b: Record<string, unknown>) { return this.service.rechnungErstellen(b); }
  @Put(':id') rechnungAktualisieren(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>) { return this.service.rechnungAktualisieren(id, b); }
  @Delete(':id') rechnungLoeschen(@Param('id', ParseIntPipe) id: number) { return this.service.rechnungLoeschen(id); }
}
