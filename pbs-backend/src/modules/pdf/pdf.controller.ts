import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Res,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import type { Request } from 'express';
import { PdfService } from './pdf.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AllowReadonlyWrite } from '../auth/decorators/allow-readonly-write.decorator';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import { contentDispositionHeader } from '../../common/http/content-disposition';
import type {
  CreateAngebotPdfDto,
  CreateChecklistSubmissionPdfDto,
  CreateEuerPdfDto,
  CreateHausmeisterEinsatzPdfDto,
  CreateHausmeisterMonatsnachweisPdfDto,
  CreateMitarbeiterAbrechnungPdfDto,
  CreateRechnungPdfDto,
} from './dto/pdf.dto';

type AuthRequest = Request & {
  user?: { rolle: string; mitarbeiterId?: number | null };
};

@Controller('api/pdf')
export class PdfController {
  constructor(private readonly service: PdfService) {}

  // â”€â”€ Neue JSON-basierte Endpunkte â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.createHausmeisterEinsatzPdf(body.einsatz_id, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }

  @Post('hausmeister/monat')
  @Roles('admin', 'mitarbeiter')
  async createHausmeisterMonatsnachweisPdf(
    @Body() body: CreateHausmeisterMonatsnachweisPdfDto,
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.createHausmeisterMonatsnachweisPdf(
      body.monat,
      body.mitarbeiter_name,
      {
        role: user.rolle,
        employeeId: user.mitarbeiterId ?? null,
      },
    );
  }

  @Post('mitarbeiter/abrechnung')
  @Roles('admin')
  async createMitarbeiterAbrechnungPdf(
    @Body() body: CreateMitarbeiterAbrechnungPdfDto,
  ) {
    return this.service.createMitarbeiterAbrechnungPdf(body.mitarbeiter_id);
  }

  @Post('checkliste/submission')
  @Roles('admin', 'readonly', 'mitarbeiter')
  @AllowReadonlyWrite()
  async createChecklistSubmissionPdf(
    @Body() body: CreateChecklistSubmissionPdfDto,
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.createChecklisteSubmissionPdf(body.submission_id, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }

  // â”€â”€ Token-basierter Download â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        .status(401)
        .json({ error: 'PDF nicht gefunden oder abgelaufen (5 Min. Limit)' });
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      contentDispositionHeader('inline', filename.slice(0, 100)),
    );
    res.setHeader('Content-Length', entry.pdf.length);
    res.send(entry.pdf);
  }

  // â”€â”€ Archiv â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('archiv')
  @Roles('admin', 'readonly')
  getArchive(
    @Query() pagination: PaginationDto,
    @Query('q') q?: string,
    @Query('typ') typ?: string,
  ) {
    return this.service.getArchive(pagination, { q, typ });
  }

  @Get('archiv/:id/regenerate')
  @Roles('admin')
  async regenerateArchive(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const pdf = await this.service.regenerateArchive(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      contentDispositionHeader('inline', 'regeneriert.pdf'),
    );
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
