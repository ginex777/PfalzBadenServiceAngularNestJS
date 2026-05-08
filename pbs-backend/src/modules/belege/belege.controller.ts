import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
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
import { BelegeService } from './belege.service';
import { contentDispositionHeader } from '../../common/http/content-disposition';
import { Roles } from '../auth/decorators/roles.decorator';
import type { BelegeQueryDto } from './dto/belege-query.dto';

@Roles('admin', 'readonly')
@Controller('api/belege')
export class BelegeController {
  constructor(private readonly service: BelegeService) {}

  @Get() belegeLaden(@Query() query: BelegeQueryDto) {
    return this.service.belegeLaden(query, query.jahr, {
      q: query.q,
      typ: query.typ,
    });
  }
  @Get('buchhaltung/:buchId') belegeFuerBuchung(
    @Param('buchId', ParseIntPipe) id: number,
  ) {
    return this.service.belegeFuerBuchung(id);
  }
  @Get(':id') belegLaden(@Param('id', ParseIntPipe) id: number) {
    return this.service.belegLaden(id);
  }

  @Get(':id/download')
  async belegDownload(
    @Param('id', ParseIntPipe) id: number,
    @Query('inline') inline: string,
    @Res() res: Response,
  ) {
    const b = await this.service.belegDownload(id);
    res.setHeader('Content-Type', b.mimetype);
    res.setHeader(
      'Content-Disposition',
      contentDispositionHeader(
        inline === '1' ? 'inline' : 'attachment',
        b.filename,
      ),
    );
    res.send(b.data);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('beleg', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  belegHochladen(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('buchhaltung_id') buchungId?: string,
    @Body('typ') typ?: string,
    @Body('notiz') notiz?: string,
  ) {
    return this.service.belegHochladen(
      file,
      buchungId ? parseInt(buchungId) : undefined,
      typ ?? 'beleg',
      notiz,
    );
  }

  @Patch(':id/notiz')
  notizAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body('notiz') notiz: string,
  ) {
    return this.service.notizAktualisieren(id, notiz);
  }

  @Delete(':id')
  belegLoeschen(@Param('id', ParseIntPipe) id: number) {
    return this.service.belegLoeschen(id);
  }
}
