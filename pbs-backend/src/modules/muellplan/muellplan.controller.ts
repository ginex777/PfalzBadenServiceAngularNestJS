import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { Workbook } from 'exceljs';
import { MuellplanService } from './muellplan.service';
import type {
  ConfirmMuellplanPdfDto,
  CopyMuellplanTermineDto,
  CreateMuellplanTerminDto,
  CreateMuellplanVorlageDto,
  ErledigunDto,
  UpdateMuellplanTerminDto,
} from './dto/muellplan.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import type { AuthRequest } from '../auth/auth-request.type';
import { contentDispositionHeader } from '../../common/http/content-disposition';
import {
  validatePdfUpload,
  validateWastePlanUpload,
} from '../../common/files/upload-file';

@Controller('api')
export class MuellplanController {
  constructor(private readonly service: MuellplanService) {}

  @Get('muellplan-upcoming')
  @Roles('admin', 'mitarbeiter')
  async anstehendeTermineLaden(
    @Query('limit') limit: string | undefined,
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.anstehendeTermineLaden(limit ? parseInt(limit) : 5, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }
  @Get('muellplan/:objektId')
  @Roles('admin', 'mitarbeiter')
  async termineLaden(
    @Param('objektId', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.termineLaden(id, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }
  @Post('muellplan')
  @Roles('admin')
  async terminErstellen(@Body() b: CreateMuellplanTerminDto) {
    return this.service.terminErstellen(b);
  }
  @Post('muellplan/copy')
  @Roles('admin')
  async termineKopieren(@Body() b: CopyMuellplanTermineDto) {
    return this.service.termineKopieren(b.from_objekt_id, b.to_objekt_id);
  }
  @Put('muellplan/:id')
  @Roles('admin')
  async terminAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: UpdateMuellplanTerminDto,
  ) {
    return this.service.terminAktualisieren(id, b);
  }
  @Patch('muellplan/:id/erledigen')
  @Roles('admin', 'mitarbeiter')
  async terminErledigen(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: ErledigunDto,
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.terminErledigen(id, b, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }

  @Delete('muellplan/:id')
  @Roles('admin')
  async terminLoeschen(@Param('id', ParseIntPipe) id: number) {
    return this.service.terminLoeschen(id);
  }

  @Get('muellplan-vorlagen')
  @Roles('admin')
  async vorlagenLaden(
    @Query() pagination: PaginationDto,
    @Query('q') q?: string,
  ) {
    return this.service.vorlagenLaden(pagination, q);
  }

  @Get('muellplan-vorlagen/all')
  @Roles('admin')
  async vorlagenAlleLaden() {
    return this.service.vorlagenAlleLaden();
  }
  @Get('muellplan-vorlagen/:id')
  @Roles('admin')
  async vorlageLaden(@Param('id', ParseIntPipe) id: number) {
    return this.service.vorlageLaden(id);
  }
  @Post('muellplan-vorlagen')
  @Roles('admin')
  async vorlageErstellen(@Body() b: CreateMuellplanVorlageDto) {
    return this.service.vorlageErstellen(b);
  }
  @Delete('muellplan-vorlagen/:id')
  @Roles('admin')
  async vorlageLoeschen(@Param('id', ParseIntPipe) id: number) {
    return this.service.vorlageLoeschen(id);
  }

  @Post('muellplan-vorlagen/:id/pdf')
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('pdf', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async vorlagePdfHochladen(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const upload = validatePdfUpload(file, 'Muellplan template PDF');
    return this.service.vorlagePdfSpeichern(
      id,
      Buffer.from(upload.data),
      upload.filename,
    );
  }

  @Get('muellplan-vorlagen/:id/pdf')
  @Roles('admin')
  async vorlagePdfLaden(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const v = await this.service.vorlagePdfLaden(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      contentDispositionHeader('inline', v.pdf_name || 'muellplan.pdf'),
    );
    res.send(v.pdf_data);
  }

  @Post('muellplan-pdf/:objektId')
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('pdf', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async muellplanPdfHochladen(
    @Param('objektId', ParseIntPipe) objektId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const upload = validateWastePlanUpload(file);
    const buffer = Buffer.from(upload.data);
    const meta = await this.service.muellplanPdfSpeichern(
      objektId,
      buffer,
      upload.filename,
    );
    // Excel/CSV direkt parsen
    const ext = upload.filename.toLowerCase().split('.').pop() ?? '';
    let parsed: Array<{ muellart: string; farbe: string; abholung: string }> =
      [];
    if (['xlsx', 'xls'].includes(ext)) {
      parsed = await this.excelCsvParsen(buffer);
    }
    return { ...meta, parsed, verified: parsed.length === 0 ? 1 : 0 };
  }

  @Post('muellplan-pdf/:objektId/confirm')
  @Roles('admin', 'mitarbeiter')
  async muellplanPdfBestaetigen(
    @Param('objektId', ParseIntPipe) objektId: number,
    @Body() b: ConfirmMuellplanPdfDto,
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.muellplanPdfBestaetigen(objektId, b.termine ?? [], {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }

  @Get('muellplan-pdf/:objektId')
  @Roles('admin', 'mitarbeiter')
  async muellplanPdfMetadaten(
    @Param('objektId', ParseIntPipe) objektId: number,
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.muellplanPdfMetadatenLaden(objektId, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }

  private async excelCsvParsen(
    buffer: Buffer,
  ): Promise<Array<{ muellart: string; farbe: string; abholung: string }>> {
    const MUELL_KEYWORDS = [
      {
        keys: ['restmÃ¼ll', 'restabfall', 'rest', 'grau'],
        name: 'RestmÃ¼ll',
        farbe: '#6b7280',
      },
      {
        keys: ['bioabfall', 'bio', 'braun'],
        name: 'Bioabfall',
        farbe: '#16a34a',
      },
      { keys: ['papier', 'pappe', 'blau'], name: 'Papier', farbe: '#2563eb' },
      {
        keys: ['gelber sack', 'gelb', 'leichtverpackung', 'wertstoff'],
        name: 'Gelber Sack',
        farbe: '#d97706',
      },
      { keys: ['glas'], name: 'Glas', farbe: '#0891b2' },
      {
        keys: ['grÃ¼nschnitt', 'grÃ¼n', 'garten'],
        name: 'GrÃ¼nschnitt',
        farbe: '#65a30d',
      },
      { keys: ['sperrmÃ¼ll', 'sperr'], name: 'SperrmÃ¼ll', farbe: '#7c3aed' },
    ];
    try {
      const workbook = new Workbook();

      const workbookData = new ArrayBuffer(buffer.byteLength);
      new Uint8Array(workbookData).set(buffer);
      await workbook.xlsx.load(workbookData);
      const results: Array<{
        muellart: string;
        farbe: string;
        abholung: string;
      }> = [];
      workbook.eachSheet((worksheet) => {
        let firstRow = true;
        worksheet.eachRow((row) => {
          if (firstRow) {
            firstRow = false;
            return;
          }
          // ExcelJS row.values is 1-indexed (index 0 is always null)
          const vals = row.values as unknown[];
          const dateVal = vals[1];
          let dt: string | null = null;
          if (dateVal instanceof Date) {
            const y = dateVal.getFullYear(),
              m = dateVal.getMonth() + 1,
              d = dateVal.getDate();
            if (y >= new Date().getFullYear() - 1)
              dt = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          } else if (typeof dateVal === 'string') {
            const m1 = dateVal.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
            if (m1) {
              const y = m1[3].length === 2 ? `20${m1[3]}` : m1[3];
              dt = `${y}-${m1[2].padStart(2, '0')}-${m1[1].padStart(2, '0')}`;
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) dt = dateVal;
          }
          if (!dt) return;
          const typeVal = String(vals[2] ?? '').toLowerCase();
          const detected = MUELL_KEYWORDS.find((k) =>
            k.keys.some((kw) => typeVal.includes(kw)),
          );
          results.push({
            muellart: detected?.name ?? String(vals[2] ?? 'Unbekannt'),
            farbe: detected?.farbe ?? '#6366f1',
            abholung: dt,
          });
        });
      });
      return results;
    } catch {
      return [];
    }
  }
}
