import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { contentDispositionHeader } from '../../common/http/content-disposition';
import { Roles } from '../auth/decorators/roles.decorator';
import { DatevService } from './datev.service';

function parsePeriod(jahr: string, monat: string | undefined) {
  return {
    jahr: parseInt(jahr),
    monat: monat !== undefined ? parseInt(monat) : -1,
  };
}

@Controller('api/datev')
@Roles('admin', 'readonly')
export class DatevController {
  constructor(private readonly datevService: DatevService) {}

  @Get('validate')
  async validieren(@Query('jahr') jahr: string, @Query('monat') monat: string) {
    const period = parsePeriod(jahr, monat);
    return this.datevService.validate(period.jahr, period.monat);
  }

  @Get('preview')
  async vorschau(@Query('jahr') jahr: string, @Query('monat') monat: string) {
    const period = parsePeriod(jahr, monat);
    return this.datevService.preview(period.jahr, period.monat);
  }

  @Get('export')
  async csvExport(
    @Query('jahr') jahr: string,
    @Query('monat') monat: string,
    @Res() res: Response,
  ) {
    const period = parsePeriod(jahr, monat);
    const exportData = await this.datevService.buildCsvExport(
      period.jahr,
      period.monat,
    );
    res.setHeader('Content-Type', 'text/csv; charset=windows-1252');
    res.setHeader(
      'Content-Disposition',
      contentDispositionHeader('attachment', exportData.filename),
    );
    res.send(exportData.content);
  }

  @Get('excel')
  async excelExport(
    @Query('jahr') jahr: string,
    @Query('monat') monat: string,
    @Res() res: Response,
  ) {
    const period = parsePeriod(jahr, monat);
    const exportData = await this.datevService.buildExcelExport(
      period.jahr,
      period.monat,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      contentDispositionHeader('attachment', exportData.filename),
    );
    res.send(exportData.content);
  }
}
