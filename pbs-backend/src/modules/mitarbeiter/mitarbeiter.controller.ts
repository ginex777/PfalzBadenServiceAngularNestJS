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
} from '@nestjs/common';
import { MitarbeiterService } from './mitarbeiter.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CreateMitarbeiterDto,
  CreateMitarbeiterStundenDto,
  StempelStartDto,
  UpdateMitarbeiterDto,
  UpdateMitarbeiterStundenDto,
} from './dto/mitarbeiter.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin', 'mitarbeiter')
@Controller('api/mitarbeiter')
export class MitarbeiterController {
  constructor(private readonly service: MitarbeiterService) {}
  @Get()
  @Roles('admin')
  alleMitarbeiterLaden(
    @Query() pagination: PaginationDto,
    @Query('q') q?: string,
    @Query('aktiv') aktiv?: string,
  ) {
    return this.service.alleMitarbeiterLaden(pagination, { q, aktiv });
  }
  @Post()
  @Roles('admin')
  mitarbeiterErstellen(@Body() b: CreateMitarbeiterDto) {
    return this.service.mitarbeiterErstellen(b);
  }
  @Put(':id')
  @Roles('admin')
  mitarbeiterAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: UpdateMitarbeiterDto,
  ) {
    return this.service.mitarbeiterAktualisieren(id, b);
  }
  @Delete(':id')
  @Roles('admin')
  mitarbeiterLoeschen(@Param('id', ParseIntPipe) id: number) {
    return this.service.mitarbeiterLoeschen(id);
  }
  @Get(':id/stunden')
  @Roles('admin')
  stundenLaden(@Param('id', ParseIntPipe) id: number) {
    return this.service.stundenLaden(id);
  }
  @Post(':id/stunden')
  @Roles('admin')
  stundenErstellen(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: CreateMitarbeiterStundenDto,
  ) {
    return this.service.stundenErstellen(id, b);
  }
  @Put('stunden/:id')
  @Roles('admin')
  stundenAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: UpdateMitarbeiterStundenDto,
  ) {
    return this.service.stundenAktualisieren(id, b);
  }
  @Delete('stunden/:id')
  @Roles('admin')
  stundenLoeschen(@Param('id', ParseIntPipe) id: number) {
    return this.service.stundenLoeschen(id);
  }
  // ── Mobile Stempeluhr ────────────────────────────────────────────────────────
  @Post(':id/stempel/start') stempelStart(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: StempelStartDto,
  ) {
    return this.service.stempelStart(id, b);
  }
  @Post(':id/stempel/stop') stempelStop(@Param('id', ParseIntPipe) id: number) {
    return this.service.stempelStop(id);
  }
  @Get(':id/zeiterfassung') zeiterfassungLaden(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.zeiterfassungLaden(id);
  }
}
