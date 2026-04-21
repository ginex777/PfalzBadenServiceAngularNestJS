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

@Controller('api/pdf')
export class PdfController {
  constructor(private readonly service: PdfService) {}

  // ── Neue JSON-basierte Endpunkte ─────────────────────────────────────────────
  @Post('rechnung')
  async createRechnungPdf(@Body() body: { rechnung_id: number }) {
    return this.service.createRechnungPdf(body.rechnung_id);
  }

  @Post('angebot')
  async createAngebotPdf(@Body() body: { angebot_id: number }) {
    return this.service.createAngebotPdf(body.angebot_id);
  }

  @Post('euer')
  async createEuerPdf(
    @Body() body: { jahr: number; ergebnis: Record<string, unknown> },
  ) {
    return this.service.createEuerPdf(body.jahr, body.ergebnis);
  }

  @Post('hausmeister/einsatz')
  async createHausmeisterEinsatzPdf(@Body() body: { einsatz_id: number }) {
    return this.service.createHausmeisterEinsatzPdf(body.einsatz_id);
  }

  @Post('hausmeister/monat')
  async createHausmeisterMonatsnachweisPdf(
    @Body() body: { monat: string; mitarbeiter_name?: string },
  ) {
    return this.service.createHausmeisterMonatsnachweisPdf(
      body.monat,
      body.mitarbeiter_name,
    );
  }

  @Post('mitarbeiter/abrechnung')
  async createMitarbeiterAbrechnungPdf(
    @Body() body: { mitarbeiter_id: number },
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
  getArchive() {
    return this.service.getArchive();
  }

  @Get('archiv/:id/regenerate')
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
  cleanArchive() {
    return this.service.cleanArchive();
  }

  @Delete('archiv/:id')
  deleteArchiveEntry(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteArchiveEntry(id);
  }

  @Delete('cache')
  clearCache() {
    return this.service.clearCache();
  }
}
