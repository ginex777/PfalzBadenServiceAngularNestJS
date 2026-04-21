import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BuchhaltungService } from './buchhaltung.service';
import {
  BuchhaltungEintragDto,
  BatchSpeichernDto,
  VstDto,
  MonatSperrenDto,
} from './dto/buchhaltung.dto';

@ApiTags('Buchhaltung')
@Controller('api')
export class BuchhaltungController {
  constructor(private readonly service: BuchhaltungService) {}

  @Get('buchhaltung/:jahr')
  @ApiOperation({ summary: 'Jahres-Buchhaltungsdaten laden' })
  getYearData(@Param('jahr', ParseIntPipe) j: number) {
    return this.service.getYearData(j);
  }

  @Post('buchhaltung/batch')
  @ApiOperation({ summary: 'Batch-Speichern (ganzer Monat)' })
  saveBatch(@Body() dto: BatchSpeichernDto) {
    return this.service.saveBatch(dto.jahr, dto.monat, dto.rows);
  }

  @Post('buchhaltung')
  @ApiOperation({ summary: 'Einzelnen Eintrag erstellen' })
  create(@Body() dto: BuchhaltungEintragDto) {
    return this.service.create(dto);
  }

  @Put('buchhaltung/:id')
  @ApiOperation({ summary: 'Eintrag aktualisieren' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BuchhaltungEintragDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete('buchhaltung/:id')
  @ApiOperation({ summary: 'Eintrag löschen' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }

  @Get('vst/:jahr')
  getVst(@Param('jahr', ParseIntPipe) j: number) {
    return this.service.getVst(j);
  }

  @Post('vst')
  saveVst(@Body() dto: VstDto) {
    return this.service.saveVst(dto);
  }

  @Get('gesperrte-monate/:jahr')
  getLockedMonths(@Param('jahr', ParseIntPipe) j: number) {
    return this.service.getLockedMonths(j);
  }

  @Post('gesperrte-monate')
  lockMonth(@Body() dto: MonatSperrenDto) {
    return this.service.lockMonth(dto.jahr, dto.monat);
  }

  @Delete('gesperrte-monate/:jahr/:monat')
  unlockMonth(
    @Param('jahr', ParseIntPipe) j: number,
    @Param('monat', ParseIntPipe) m: number,
  ) {
    return this.service.unlockMonth(j, m);
  }
}
