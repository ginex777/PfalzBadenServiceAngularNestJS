import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { VertraegeService } from './vertraege.service';
import { PdfService } from '../pdf/pdf.service';

@ApiTags('Vertraege')
@Controller('api/vertraege')
export class VertraegeController {
  constructor(
    private readonly service: VertraegeService,
    private readonly pdf: PdfService,
  ) {}

  @Get()
  alleLaden(@Query('kunden_id') kundenId?: string) {
    return this.service.alleLaden(kundenId ? Number(kundenId) : undefined);
  }

  @Get(':id')
  einenLaden(@Param('id', ParseIntPipe) id: number) {
    return this.service.einenLaden(id);
  }

  @Post()
  erstellen(@Body() b: Record<string, unknown>, @Req() req: Request) {
    return this.service.erstellen(b, req.headers['x-nutzer'] as string);
  }

  @Put(':id')
  aktualisieren(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>, @Req() req: Request) {
    return this.service.aktualisieren(id, b, req.headers['x-nutzer'] as string);
  }

  @Delete(':id')
  loeschen(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.service.loeschen(id, req.headers['x-nutzer'] as string);
  }

  /** Generate PDF and return a short-lived download token */
  @Post(':id/pdf')
  async pdfErstellen(@Param('id', ParseIntPipe) id: number) {
    return this.pdf.vertragPdfErstellen(id);
  }

  /** Preview the PDF inline in browser */
  @Get('pdf/view/:token/:filename')
  pdfView(@Param('token') token: string, @Res() res: Response) {
    const entry = this.pdf.tokenAbrufen(token);
    if (!entry) return res.status(410).json({ message: 'Token abgelaufen' });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${entry.filename}"` });
    res.send(entry.pdf);
  }
}
