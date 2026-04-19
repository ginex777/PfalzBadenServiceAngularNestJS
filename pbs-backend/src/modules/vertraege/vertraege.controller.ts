import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { VertraegeService } from './vertraege.service';
import { PdfService } from '../pdf/pdf.service';
import { Public } from '../auth/decorators/public.decorator';
import { CreateVertragDto, UpdateVertragDto } from './dto/vertrag.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Vertraege')
@Controller('api/vertraege')
export class VertraegeController {
  constructor(
    private readonly service: VertraegeService,
    private readonly pdf: PdfService,
  ) {}

  @Get()
  alleLaden(@Query() pagination: PaginationDto, @Query('kunden_id') kundenId?: string) {
    return this.service.alleLaden(pagination, kundenId ? Number(kundenId) : undefined);
  }

  @Get(':id')
  einenLaden(@Param('id', ParseIntPipe) id: number) {
    return this.service.einenLaden(id);
  }

  @Post()
  @ApiOperation({ summary: 'Vertrag erstellen' })
  erstellen(@Body() dto: CreateVertragDto, @Req() req: Request) {
    return this.service.erstellen(dto, req.headers['x-nutzer'] as string);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Vertrag aktualisieren' })
  aktualisieren(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVertragDto, @Req() req: Request) {
    return this.service.aktualisieren(id, dto, req.headers['x-nutzer'] as string);
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
  @Public()
  @Get('pdf/view/:token/:filename')
  pdfView(@Param('token') token: string, @Res() res: Response) {
    const entry = this.pdf.tokenAbrufen(token);
    if (!entry) return res.status(410).json({ message: 'Token abgelaufen' });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${entry.filename}"` });
    res.send(entry.pdf);
  }
}
