import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { MarketingService } from './marketing.service';

@Controller('api/marketing')
export class MarketingController {
  constructor(private readonly service: MarketingService) {}
  @Get() alleKontakteLaden() { return this.service.alleKontakteLaden(); }
  @Post() kontaktErstellen(@Body() b: Record<string, unknown>) { return this.service.kontaktErstellen(b); }
  @Put(':id') kontaktAktualisieren(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>) { return this.service.kontaktAktualisieren(id, b); }
  @Delete(':id') kontaktLoeschen(@Param('id', ParseIntPipe) id: number) { return this.service.kontaktLoeschen(id); }
}
