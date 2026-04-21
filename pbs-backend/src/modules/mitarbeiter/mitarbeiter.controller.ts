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

@Controller('api/mitarbeiter')
export class MitarbeiterController {
  constructor(private readonly service: MitarbeiterService) {}
  @Get() alleMitarbeiterLaden(@Query() pagination: PaginationDto) {
    return this.service.alleMitarbeiterLaden(pagination);
  }
  @Post() mitarbeiterErstellen(@Body() b: Record<string, unknown>) {
    return this.service.mitarbeiterErstellen(b);
  }
  @Put(':id') mitarbeiterAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: Record<string, unknown>,
  ) {
    return this.service.mitarbeiterAktualisieren(id, b);
  }
  @Delete(':id') mitarbeiterLoeschen(@Param('id', ParseIntPipe) id: number) {
    return this.service.mitarbeiterLoeschen(id);
  }
  @Get(':id/stunden') stundenLaden(@Param('id', ParseIntPipe) id: number) {
    return this.service.stundenLaden(id);
  }
  @Post(':id/stunden') stundenErstellen(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: Record<string, unknown>,
  ) {
    return this.service.stundenErstellen(id, b);
  }
  @Put('stunden/:id') stundenAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: Record<string, unknown>,
  ) {
    return this.service.stundenAktualisieren(id, b);
  }
  @Delete('stunden/:id') stundenLoeschen(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.stundenLoeschen(id);
  }
  // ── Mobile Stempeluhr ────────────────────────────────────────────────────────
  @Post(':id/stempel/start') stempelStart(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: Record<string, unknown>,
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
