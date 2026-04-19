import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from './pdf.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/pdf')
export class PdfController {
  constructor(private readonly service: PdfService) {}

  // ── Neue JSON-basierte Endpunkte ─────────────────────────────────────────────
  @Post('rechnung')
  async rechnungPdfErstellen(@Body() body: { rechnung_id: number }) {
    return this.service.rechnungPdfErstellen(body.rechnung_id);
  }

  @Post('angebot')
  async angebotPdfErstellen(@Body() body: { angebot_id: number }) {
    return this.service.angebotPdfErstellen(body.angebot_id);
  }

  @Post('euer')
  async euerPdfErstellen(@Body() body: { jahr: number; ergebnis: Record<string, unknown> }) {
    return this.service.euerPdfErstellen(body.jahr, body.ergebnis);
  }

  @Post('hausmeister/einsatz')
  async hausmeisterEinsatzPdfErstellen(@Body() body: { einsatz_id: number }) {
    return this.service.hausmeisterEinsatzPdfErstellen(body.einsatz_id);
  }

  @Post('hausmeister/monat')
  async hausmeisterMonatsnachweisPdfErstellen(@Body() body: { monat: string; mitarbeiter_name?: string }) {
    return this.service.hausmeisterMonatsnachweisPdfErstellen(body.monat, body.mitarbeiter_name);
  }

  @Post('mitarbeiter/abrechnung')
  async mitarbeiterAbrechnungPdfErstellen(@Body() body: { mitarbeiter_id: number }) {
    return this.service.mitarbeiterAbrechnungPdfErstellen(body.mitarbeiter_id);
  }

  // ── Token-basierter Download ─────────────────────────────────────────────────
  @Public()
  @Get('view/:token/:filename')
  pdfAnzeigen(@Param('token') token: string, @Param('filename') filename: string, @Res() res: Response) {
    const entry = this.service.tokenAbrufen(token);
    if (!entry) { res.status(404).json({ error: 'PDF nicht gefunden oder abgelaufen (5 Min. Limit)' }); return; }
    const safe = filename.replace(/[^\w\-äöüÄÖÜß.]/g, '_').slice(0, 100);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safe}"`);
    res.setHeader('Content-Length', entry.pdf.length);
    res.send(entry.pdf);
  }

  // ── Archiv ───────────────────────────────────────────────────────────────────
  @Get('archiv')
  archivLaden() { return this.service.archivLaden(); }

  @Get('archiv/:id/regenerate')
  async archivRegenerieren(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pdf = await this.service.archivRegenerieren(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="regeneriert.pdf"');
    res.send(pdf);
  }

  @Delete('archiv/cleanup')
  archivBereinigen() { return this.service.archivBereinigen(); }

  @Delete('archiv/:id')
  archivEintragLoeschen(@Param('id', ParseIntPipe) id: number) { return this.service.archivEintragLoeschen(id); }

  @Delete('cache')
  cacheLeeren() { return this.service.cacheLeeren(); }
}
