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
  BadRequestException,
} from '@nestjs/common';
import { MitarbeiterService } from './mitarbeiter.service';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import type {
  CreateMitarbeiterDto,
  CreateMitarbeiterStundenDto,
  StempelStartDto,
  UpdateMitarbeiterDto,
  UpdateMitarbeiterStundenDto,
} from './dto/mitarbeiter.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthRequest } from '../auth/auth-request.type';

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
  // â”€â”€ Mobile Stempeluhr â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Post(':id/stempel/start') stempelStart(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: StempelStartDto,
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.stempelStart(id, b, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }
  @Post(':id/stempel/stop') stempelStop(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.stempelStop(id, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }
  @Get(':id/zeiterfassung') zeiterfassungLaden(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.zeiterfassungLaden(id, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }

  @Get(':id/stempel/aktiv') aktiverStempel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.aktiverStempel(id, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }
}
