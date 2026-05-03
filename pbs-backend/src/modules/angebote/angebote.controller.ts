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
import type { AngeboteService } from './angebote.service';
import type { CreateAngebotDto, UpdateAngebotDto } from './dto/angebot.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Angebote')
@ApiSecurity('x-nutzer')
@Roles('admin', 'readonly')
@Controller('api/angebote')
export class AngeboteController {
  constructor(private readonly service: AngeboteService) {}

  @Get()
  @ApiOperation({ summary: 'Alle Angebote laden' })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(pagination, { q, status });
  }

  @Post()
  @ApiOperation({ summary: 'Angebot erstellen' })
  create(@Body() dto: CreateAngebotDto, @Headers('x-nutzer') nutzer?: string) {
    return this.service.create(dto, nutzer);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Angebot aktualisieren' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAngebotDto,
    @Headers('x-nutzer') nutzer?: string,
  ) {
    return this.service.update(id, dto, nutzer);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Angebot löschen' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-nutzer') nutzer?: string,
  ) {
    return this.service.delete(id, nutzer);
  }
}
