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
import type { Response } from 'express';
import { BelegeService } from './belege.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin', 'readonly')
@Controller('api/belege')
export class BelegeController {
  constructor(private readonly service: BelegeService) {}

  @Get() belegeLaden(
    @Query() pagination: PaginationDto,
    @Query('jahr') jahr?: string,
    @Query('q') q?: string,
    @Query('typ') typ?: string,
  ) {
    return this.service.belegeLaden(
      pagination,
      jahr ? parseInt(jahr) : undefined,
      { q, typ },
    );
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
      `${inline === '1' ? 'inline' : 'attachment'}; filename="${b.filename}"`,
    );
    res.send(b.data);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('beleg'))
  belegHochladen(
    @UploadedFile() file: Express.Multer.File,
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
