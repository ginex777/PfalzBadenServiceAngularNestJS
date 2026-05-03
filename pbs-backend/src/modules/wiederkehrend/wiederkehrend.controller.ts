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
import type { WiederkehrendService } from './wiederkehrend.service';
import type {
  CreateWiederkehrendeAusgabeDto,
  CreateWiederkehrendeRechnungDto,
  UpdateWiederkehrendeAusgabeDto,
  UpdateWiederkehrendeRechnungDto,
} from './dto/wiederkehrend.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import type { PaginationDto } from '../../common/dto/pagination.dto';

@Roles('admin', 'readonly')
@Controller('api')
export class WiederkehrendController {
  constructor(private readonly service: WiederkehrendService) {}
  @Get('wiederkehrend') ausgabenLaden(@Query() pagination: PaginationDto) {
    return this.service.ausgabenLaden(pagination);
  }
  @Post('wiederkehrend') ausgabeErstellen(
    @Body() b: CreateWiederkehrendeAusgabeDto,
  ) {
    return this.service.ausgabeErstellen(b);
  }
  @Put('wiederkehrend/:id') ausgabeAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: UpdateWiederkehrendeAusgabeDto,
  ) {
    return this.service.ausgabeAktualisieren(id, b);
  }
  @Delete('wiederkehrend/:id') ausgabeLoeschen(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.ausgabeLoeschen(id);
  }
  @Get('wiederkehrend-rechnungen') rechnungenLaden(
    @Query() pagination: PaginationDto,
  ) {
    return this.service.rechnungenLaden(pagination);
  }
  @Post('wiederkehrend-rechnungen') rechnungErstellen(
    @Body() b: CreateWiederkehrendeRechnungDto,
  ) {
    return this.service.rechnungErstellen(b);
  }
  @Put('wiederkehrend-rechnungen/:id') rechnungAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: UpdateWiederkehrendeRechnungDto,
  ) {
    return this.service.rechnungAktualisieren(id, b);
  }
  @Delete('wiederkehrend-rechnungen/:id') rechnungLoeschen(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.rechnungLoeschen(id);
  }
}
