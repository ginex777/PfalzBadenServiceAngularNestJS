import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { WiederkehrendService } from './wiederkehrend.service';

@Controller('api')
export class WiederkehrendController {
  constructor(private readonly service: WiederkehrendService) {}
  @Get('wiederkehrend') ausgabenLaden() { return this.service.ausgabenLaden(); }
  @Post('wiederkehrend') ausgabeErstellen(@Body() b: Record<string, unknown>) { return this.service.ausgabeErstellen(b); }
  @Put('wiederkehrend/:id') ausgabeAktualisieren(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>) { return this.service.ausgabeAktualisieren(id, b); }
  @Delete('wiederkehrend/:id') ausgabeLoeschen(@Param('id', ParseIntPipe) id: number) { return this.service.ausgabeLoeschen(id); }
  @Get('wiederkehrend-rechnungen') rechnungenLaden() { return this.service.rechnungenLaden(); }
  @Post('wiederkehrend-rechnungen') rechnungErstellen(@Body() b: Record<string, unknown>) { return this.service.rechnungErstellen(b); }
  @Put('wiederkehrend-rechnungen/:id') rechnungAktualisieren(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>) { return this.service.rechnungAktualisieren(id, b); }
  @Delete('wiederkehrend-rechnungen/:id') rechnungLoeschen(@Param('id', ParseIntPipe) id: number) { return this.service.rechnungLoeschen(id); }
}
