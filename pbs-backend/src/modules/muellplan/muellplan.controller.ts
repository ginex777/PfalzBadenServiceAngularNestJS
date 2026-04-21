import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { MuellplanService } from './muellplan.service';
import {
  ConfirmMuellplanPdfDto,
  CopyMuellplanTermineDto,
  CreateMuellplanTerminDto,
  CreateMuellplanVorlageDto,
  CreateObjektDto,
  UpdateMuellplanTerminDto,
  UpdateObjektDto,
} from './dto/muellplan.dto';

@Controller('api')
export class MuellplanController {
  constructor(private readonly service: MuellplanService) {}

  @Get('objekte') async objekteLaden() {
    return this.service.objekteLaden();
  }
  @Post('objekte') async objektErstellen(@Body() b: CreateObjektDto) {
    return this.service.objektErstellen(b);
  }
  @Put('objekte/:id') async objektAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: UpdateObjektDto,
  ) {
    return this.service.objektAktualisieren(id, b);
  }
  @Delete('objekte/:id') async objektLoeschen(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.objektLoeschen(id);
  }

  @Get('muellplan-upcoming') async anstehendeTermineLaden(
    @Query('limit') limit?: string,
  ) {
    return this.service.anstehendeTermineLaden(limit ? parseInt(limit) : 5);
  }
  @Get('muellplan/:objektId') async termineLaden(
    @Param('objektId', ParseIntPipe) id: number,
  ) {
    return this.service.termineLaden(id);
  }
  @Post('muellplan') async terminErstellen(@Body() b: CreateMuellplanTerminDto) {
    return this.service.terminErstellen(b);
  }
  @Post('muellplan/copy') async termineKopieren(
    @Body() b: CopyMuellplanTermineDto,
  ) {
    return this.service.termineKopieren(b.from_objekt_id, b.to_objekt_id);
  }
  @Put('muellplan/:id') async terminAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: UpdateMuellplanTerminDto,
  ) {
    return this.service.terminAktualisieren(id, b);
  }
  @Delete('muellplan/:id') async terminLoeschen(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.terminLoeschen(id);
  }

  @Get('muellplan-vorlagen') async vorlagenLaden() {
    return this.service.vorlagenLaden();
  }
  @Get('muellplan-vorlagen/:id') async vorlageLaden(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.vorlageLaden(id);
  }
  @Post('muellplan-vorlagen') async vorlageErstellen(
    @Body() b: CreateMuellplanVorlageDto,
  ) {
    return this.service.vorlageErstellen(b);
  }
  @Delete('muellplan-vorlagen/:id') async vorlageLoeschen(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.vorlageLoeschen(id);
  }

  @Post('muellplan-vorlagen/:id/pdf')
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
    if (!file) return { error: 'Keine Datei' };
    return this.service.vorlagePdfSpeichern(id, file.buffer, file.originalname);
  }

  @Get('muellplan-vorlagen/:id/pdf')
  async vorlagePdfLaden(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const v = await this.service.vorlagePdfLaden(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${v.pdf_name || 'muellplan.pdf'}"`,
    );
    res.send(v.pdf_data);
  }

  @Post('muellplan-pdf/:objektId')
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
    if (!file) return { error: 'Keine Datei' };
    const meta = await this.service.muellplanPdfSpeichern(
      objektId,
      file.buffer,
      file.originalname,
    );
    // Excel/CSV direkt parsen
    const ext = file.originalname.toLowerCase().split('.').pop() ?? '';
    let parsed: { muellart: string; farbe: string; abholung: string }[] = [];
    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      parsed = this.excelCsvParsen(file.buffer);
    }
    return { ...meta, parsed, verified: parsed.length === 0 ? 1 : 0 };
  }

  @Post('muellplan-pdf/:objektId/confirm')
  async muellplanPdfBestaetigen(
    @Param('objektId', ParseIntPipe) objektId: number,
    @Body() b: ConfirmMuellplanPdfDto,
  ) {
    return this.service.muellplanPdfBestaetigen(objektId, b.termine ?? []);
  }

  @Get('muellplan-pdf/:objektId')
  async muellplanPdfMetadaten(
    @Param('objektId', ParseIntPipe) objektId: number,
  ) {
    return this.service.muellplanPdfMetadatenLaden(objektId);
  }

  private excelCsvParsen(
    buffer: Buffer,
  ): { muellart: string; farbe: string; abholung: string }[] {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const XLSX = require('xlsx') as typeof import('xlsx');
      const MUELL_KEYWORDS = [
        {
          keys: ['restmüll', 'restabfall', 'rest', 'grau'],
          name: 'Restmüll',
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
          keys: ['grünschnitt', 'grün', 'garten'],
          name: 'Grünschnitt',
          farbe: '#65a30d',
        },
        { keys: ['sperrmüll', 'sperr'], name: 'Sperrmüll', farbe: '#7c3aed' },
      ];
      const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
      const results: { muellart: string; farbe: string; abholung: string }[] =
        [];
      for (const sheetName of wb.SheetNames) {
        const rowsRaw: unknown = XLSX.utils.sheet_to_json(
          wb.Sheets[sheetName],
          {
            header: 1,
            defval: '',
          },
        );
        if (!Array.isArray(rowsRaw)) continue;

        for (let i = 1; i < rowsRaw.length; i++) {
          const row = rowsRaw[i];
          if (!Array.isArray(row)) continue;

          const dateVal = row[0];
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
              const y = m1[3].length === 2 ? '20' + m1[3] : m1[3];
              dt = `${y}-${m1[2].padStart(2, '0')}-${m1[1].padStart(2, '0')}`;
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) dt = dateVal;
          }
          if (!dt) continue;
          const typeVal = String(row[1] ?? '').toLowerCase();
          const detected = MUELL_KEYWORDS.find((k) =>
            k.keys.some((kw) => typeVal.includes(kw)),
          );
          results.push({
            muellart: detected?.name ?? String(row[1] ?? 'Unbekannt'),
            farbe: detected?.farbe ?? '#6366f1',
            abholung: dt,
          });
        }
      }
      return results;
    } catch {
      return [];
    }
  }
}
