import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Headers,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { KundenService } from './kunden.service';
import { CreateKundeDto, UpdateKundeDto } from './dto/kunde.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Kunden')
@ApiSecurity('x-nutzer')
@Roles('admin', 'readonly')
@Controller('api/kunden')
export class KundenController {
  constructor(private readonly service: KundenService) {}

  @Get()
  @ApiOperation({ summary: 'Alle Kunden laden' })
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Kunde erstellen' })
  create(@Body() dto: CreateKundeDto, @Headers('x-nutzer') user?: string) {
    return this.service.create(dto, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Kunde aktualisieren' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateKundeDto,
    @Headers('x-nutzer') user?: string,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Kunde löschen' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-nutzer') user?: string,
  ) {
    return this.service.delete(id, user);
  }
}
