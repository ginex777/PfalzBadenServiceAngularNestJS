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
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { VertraegeService } from './vertraege.service';
import { PdfService } from '../pdf/pdf.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AllowReadonlyWrite } from '../auth/decorators/allow-readonly-write.decorator';
import { CreateVertragDto, UpdateVertragDto } from './dto/vertrag.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Vertraege')
@Roles('admin', 'readonly')
@Controller('api/vertraege')
export class VertraegeController {
  constructor(
    private readonly service: VertraegeService,
    private readonly pdf: PdfService,
  ) {}

  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query('kunden_id') kundenId?: string,
  ) {
    return this.service.findAll(
      pagination,
      kundenId ? Number(kundenId) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Vertrag erstellen' })
  create(@Body() dto: CreateVertragDto, @Req() req: Request) {
    return this.service.create(dto, req.headers['x-nutzer'] as string);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Vertrag aktualisieren' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVertragDto,
    @Req() req: Request,
  ) {
    return this.service.update(id, dto, req.headers['x-nutzer'] as string);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.service.delete(id, req.headers['x-nutzer'] as string);
  }

  /** Generate PDF and return a short-lived download token */
  @Post(':id/pdf')
  @AllowReadonlyWrite()
  async pdfErstellen(@Param('id', ParseIntPipe) id: number) {
    return this.pdf.createVertragPdf(id);
  }

  /** Preview the PDF inline in browser */
  @Public()
  @Get('pdf/view/:token/:filename')
  pdfView(@Param('token') token: string, @Res() res: Response) {
    const entry = this.pdf.getToken(token);
    if (!entry) return res.status(410).json({ message: 'Token abgelaufen' });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${entry.filename}"`,
    });
    res.send(entry.pdf);
  }
}
