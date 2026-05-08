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
import { HausmeisterService } from './hausmeister.service';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import type {
  CreateHausmeisterEinsatzDto,
  UpdateHausmeisterEinsatzDto,
} from './dto/hausmeister.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthRequest } from '../auth/auth-request.type';

@Roles('admin', 'mitarbeiter')
@Controller('api/hausmeister')
export class HausmeisterController {
  constructor(private readonly service: HausmeisterService) {}
  @Get()
  @Roles('admin')
  alleEinsaetzeLaden(
    @Query() pagination: PaginationDto,
    @Query('q') q?: string,
    @Query('mitarbeiter') mitarbeiter?: string,
    @Query('monat') monat?: string,
  ) {
    return this.service.alleEinsaetzeLaden(pagination, {
      q,
      mitarbeiter,
      monat,
    });
  }
  @Get('me')
  @Roles('mitarbeiter')
  eigeneEinsaetze(@Req() req: AuthRequest) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    if (user.mitarbeiterId == null) {
      throw new BadRequestException({
        code: 'MISSING_EMPLOYEE_MAPPING',
        message:
          'Kein Mitarbeiter-Mapping vorhanden. Bitte Admin kontaktieren (User <-> Mitarbeiter zuordnen).',
      });
    }
    return this.service.einsaetzeFuerMitarbeiterLaden(user.mitarbeiterId, {
      role: user.rolle,
      employeeId: user.mitarbeiterId,
    });
  }
  @Get('mitarbeiter/:mid')
  @Roles('admin')
  einsaetzeFuerMitarbeiter(@Param('mid', ParseIntPipe) mid: number) {
    return this.service.einsaetzeFuerMitarbeiterLaden(mid, {
      role: 'admin',
      employeeId: null,
    });
  }
  @Post()
  @Roles('admin')
  einsatzErstellen(@Body() b: CreateHausmeisterEinsatzDto) {
    return this.service.einsatzErstellen(b);
  }
  @Put(':id')
  @Roles('admin')
  einsatzAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: UpdateHausmeisterEinsatzDto,
  ) {
    return this.service.einsatzAktualisieren(id, b);
  }
  @Delete(':id')
  @Roles('admin')
  einsatzLoeschen(@Param('id', ParseIntPipe) id: number) {
    return this.service.einsatzLoeschen(id);
  }
}
