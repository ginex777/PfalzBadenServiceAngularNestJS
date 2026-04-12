import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BuchhaltungService } from './buchhaltung.service';
import { BuchhaltungEintragDto, BatchSpeichernDto, VstDto, MonatSperrenDto } from './dto/buchhaltung.dto';

@ApiTags('Buchhaltung')
@Controller('api')
export class BuchhaltungController {
  constructor(private readonly service: BuchhaltungService) {}

  @Get('buchhaltung/:jahr')
  @ApiOperation({ summary: 'Jahres-Buchhaltungsdaten laden' })
  jahresDateLaden(@Param('jahr', ParseIntPipe) j: number) { return this.service.jahresDateLaden(j); }

  @Post('buchhaltung/batch')
  @ApiOperation({ summary: 'Batch-Speichern (ganzer Monat)' })
  batchSpeichern(@Body() dto: BatchSpeichernDto) { return this.service.batchSpeichern(dto.jahr, dto.monat, dto.rows as unknown as Record<string, unknown>[]); }

  @Post('buchhaltung')
  @ApiOperation({ summary: 'Einzelnen Eintrag erstellen' })
  eintragErstellen(@Body() dto: BuchhaltungEintragDto) { return this.service.eintragErstellen(dto as unknown as Record<string, unknown>); }

  @Put('buchhaltung/:id')
  @ApiOperation({ summary: 'Eintrag aktualisieren' })
  eintragAktualisieren(@Param('id', ParseIntPipe) id: number, @Body() dto: BuchhaltungEintragDto) { return this.service.eintragAktualisieren(id, dto as unknown as Record<string, unknown>); }

  @Delete('buchhaltung/:id')
  @ApiOperation({ summary: 'Eintrag löschen' })
  eintragLoeschen(@Param('id', ParseIntPipe) id: number) { return this.service.eintragLoeschen(id); }

  @Get('vst/:jahr')
  vstLaden(@Param('jahr', ParseIntPipe) j: number) { return this.service.vstLaden(j); }

  @Post('vst')
  vstSpeichern(@Body() dto: VstDto) { return this.service.vstSpeichern(dto as unknown as Record<string, unknown>); }

  @Get('gesperrte-monate/:jahr')
  gesperrteMonateLaden(@Param('jahr', ParseIntPipe) j: number) { return this.service.gesperrteMonateLaden(j); }

  @Post('gesperrte-monate')
  monatSperren(@Body() dto: MonatSperrenDto) { return this.service.monatSperren(dto.jahr, dto.monat); }

  @Delete('gesperrte-monate/:jahr/:monat')
  monatEntsperren(@Param('jahr', ParseIntPipe) j: number, @Param('monat', ParseIntPipe) m: number) { return this.service.monatEntsperren(j, m); }
}
