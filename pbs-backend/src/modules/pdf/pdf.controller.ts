import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from './pdf.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AllowReadonlyWrite } from '../auth/decorators/allow-readonly-write.decorator';
import {
  CreateAngebotPdfDto,
  CreateEuerPdfDto,
  CreateHausmeisterEinsatzPdfDto,
  CreateHausmeisterMonatsnachweisPdfDto,
  CreateMitarbeiterAbrechnungPdfDto,
  CreateRechnungPdfDto,
} from './dto/pdf.dto';

@Controller('api/pdf')
export class PdfController {
  constructor(private readonly service: PdfService) {}

  // ── Neue JSON-basierte Endpunkte ─────────────────────────────────────────────
  @Post('rechnung')
  @Roles('admin', 'readonly')
  @AllowReadonlyWrite()
  async createRechnungPdf(@Body() body: CreateRechnungPdfDto) {
    return this.service.createRechnungPdf(body.rechnung_id);
  }

  @Post('angebot')
  @Roles('admin', 'readonly')
  @AllowReadonlyWrite()
  async createAngebotPdf(@Body() body: CreateAngebotPdfDto) {
    return this.service.createAngebotPdf(body.angebot_id);
  }

  @Post('euer')
  @Roles('admin', 'readonly')
  @AllowReadonlyWrite()
  async createEuerPdf(@Body() body: CreateEuerPdfDto) {
    return this.service.createEuerPdf(body.jahr, body.ergebnis);
  }

  @Post('hausmeister/einsatz')
  @Roles('admin', 'mitarbeiter')
  async createHausmeisterEinsatzPdf(
    @Body() body: CreateHausmeisterEinsatzPdfDto,
  ) {
    return this.service.createHausmeisterEinsatzPdf(body.einsatz_id);
  }

  @Post('hausmeister/monat')
  @Roles('admin', 'mitarbeiter')
  async createHausmeisterMonatsnachweisPdf(
    @Body() body: CreateHausmeisterMonatsnachweisPdfDto,
  ) {
    return this.service.createHausmeisterMonatsnachweisPdf(
      body.monat,
      body.mitarbeiter_name,
    );
  }

  @Post('mitarbeiter/abrechnung')
  @Roles('admin')
  async createMitarbeiterAbrechnungPdf(
    @Body() body: CreateMitarbeiterAbrechnungPdfDto,
  ) {
    return this.service.createMitarbeiterAbrechnungPdf(body.mitarbeiter_id);
  }

  // ── Token-basierter Download ─────────────────────────────────────────────────
  @Public()
  @Get('view/:token/:filename')
  viewPdf(
    @Param('token') token: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const entry = this.service.getToken(token);
    if (!entry) {
      res
        .status(404)
        .json({ error: 'PDF nicht gefunden oder abgelaufen (5 Min. Limit)' });
      return;
    }
    const safe = filename.replace(/[^\w\-äöüÄÖÜß.]/g, '_').slice(0, 100);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safe}"`);
    res.setHeader('Content-Length', entry.pdf.length);
    res.send(entry.pdf);
  }

  // ── Archiv ───────────────────────────────────────────────────────────────────
  @Get('archiv')
  @Roles('admin', 'readonly')
  getArchive() {
    return this.service.getArchive();
  }

  @Get('archiv/:id/regenerate')
  @Roles('admin')
  async regenerateArchive(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const pdf = await this.service.regenerateArchive(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="regeneriert.pdf"');
    res.send(pdf);
  }

  @Delete('archiv/cleanup')
  @Roles('admin')
  cleanArchive() {
    return this.service.cleanArchive();
  }

  @Delete('archiv/:id')
  @Roles('admin')
  deleteArchiveEntry(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteArchiveEntry(id);
  }

  @Delete('cache')
  @Roles('admin')
  clearCache() {
    return this.service.clearCache();
  }
}
