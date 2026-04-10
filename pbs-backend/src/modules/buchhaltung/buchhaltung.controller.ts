import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { BuchhaltungService } from './buchhaltung.service';

@Controller('api')
export class BuchhaltungController {
  constructor(private readonly service: BuchhaltungService) {}

  @Get('buchhaltung/:jahr') jahresDateLaden(@Param('jahr', ParseIntPipe) j: number) { return this.service.jahresDateLaden(j); }
  @Post('buchhaltung/batch') batchSpeichern(@Body() b: { jahr: number; monat: number; rows: Record<string, unknown>[] }) { return this.service.batchSpeichern(b.jahr, b.monat, b.rows); }
  @Post('buchhaltung') eintragErstellen(@Body() b: Record<string, unknown>) { return this.service.eintragErstellen(b); }
  @Put('buchhaltung/:id') eintragAktualisieren(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>) { return this.service.eintragAktualisieren(id, b); }
  @Delete('buchhaltung/:id') eintragLoeschen(@Param('id', ParseIntPipe) id: number) { return this.service.eintragLoeschen(id); }

  @Get('vst/:jahr') vstLaden(@Param('jahr', ParseIntPipe) j: number) { return this.service.vstLaden(j); }
  @Post('vst') vstSpeichern(@Body() b: Record<string, unknown>) { return this.service.vstSpeichern(b); }

  @Get('gesperrte-monate/:jahr') gesperrteMonateLaden(@Param('jahr', ParseIntPipe) j: number) { return this.service.gesperrteMonateLaden(j); }
  @Post('gesperrte-monate') monatSperren(@Body() b: { jahr: number; monat: number }) { return this.service.monatSperren(b.jahr, b.monat); }
  @Delete('gesperrte-monate/:jahr/:monat') monatEntsperren(@Param('jahr', ParseIntPipe) j: number, @Param('monat', ParseIntPipe) m: number) { return this.service.monatEntsperren(j, m); }
}
