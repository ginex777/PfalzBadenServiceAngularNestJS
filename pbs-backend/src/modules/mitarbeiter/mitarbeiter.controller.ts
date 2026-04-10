import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { MitarbeiterService } from './mitarbeiter.service';

@Controller('api/mitarbeiter')
export class MitarbeiterController {
  constructor(private readonly service: MitarbeiterService) {}
  @Get() alleMitarbeiterLaden() { return this.service.alleMitarbeiterLaden(); }
  @Post() mitarbeiterErstellen(@Body() b: Record<string, unknown>) { return this.service.mitarbeiterErstellen(b); }
  @Put(':id') mitarbeiterAktualisieren(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>) { return this.service.mitarbeiterAktualisieren(id, b); }
  @Delete(':id') mitarbeiterLoeschen(@Param('id', ParseIntPipe) id: number) { return this.service.mitarbeiterLoeschen(id); }
  @Get(':id/stunden') stundenLaden(@Param('id', ParseIntPipe) id: number) { return this.service.stundenLaden(id); }
  @Post(':id/stunden') stundenErstellen(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>) { return this.service.stundenErstellen(id, b); }
  @Put('stunden/:id') stundenAktualisieren(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>) { return this.service.stundenAktualisieren(id, b); }
  @Delete('stunden/:id') stundenLoeschen(@Param('id', ParseIntPipe) id: number) { return this.service.stundenLoeschen(id); }
}
