import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import type {
  EvidenceListQueryDto,
  UploadEvidenceDto,
} from './dto/nachweise.dto';
import { NachweiseService } from './nachweise.service';
import type { AuthRequest } from '../auth/auth-request.type';
import { contentDispositionHeader } from '../../common/http/content-disposition';

@Controller('api/nachweise')
@Roles('admin', 'readonly', 'mitarbeiter')
export class NachweiseController {
  constructor(private readonly service: NachweiseService) {}

  @Get()
  list(@Query() query: EvidenceListQueryDto, @Req() req: AuthRequest) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.list(query, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.get(id, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }

  @Get(':id/download')
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Query('inline') inline: string,
    @Res() res: Response,
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    const row = await this.service.download(id, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
    res.setHeader('Content-Type', row.mimetype);
    res.setHeader(
      'Content-Disposition',
      contentDispositionHeader(
        inline === '1' ? 'inline' : 'attachment',
        row.filename,
      ),
    );
    res.send(row.data);
  }

  @Post('upload')
  @Roles('admin', 'mitarbeiter')
  @UseInterceptors(FileInterceptor('photo'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadEvidenceDto,
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');

    const employeeId = user.mitarbeiterId ?? null;
    if (user.rolle === 'mitarbeiter' && employeeId == null) {
      throw new BadRequestException({
        code: 'MISSING_EMPLOYEE_MAPPING',
        message:
          'Kein Mitarbeiter-Mapping vorhanden. Bitte Admin kontaktieren (User â†” Mitarbeiter zuordnen).',
      });
    }

    return this.service.upload({
      file,
      dto,
      createdBy: {
        email: user.email,
        fullName: user.fullName ?? user.email,
      },
      employeeId,
      auth: { role: user.rolle, employeeId },
    });
  }
}
