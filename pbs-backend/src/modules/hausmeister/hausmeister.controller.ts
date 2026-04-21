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
import { HausmeisterService } from './hausmeister.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CreateHausmeisterEinsatzDto,
  UpdateHausmeisterEinsatzDto,
} from './dto/hausmeister.dto';

@Controller('api/hausmeister')
export class HausmeisterController {
  constructor(private readonly service: HausmeisterService) {}
  @Get() alleEinsaetzeLaden(@Query() pagination: PaginationDto) {
    return this.service.alleEinsaetzeLaden(pagination);
  }
  @Get('mitarbeiter/:mid') einsaetzeFuerMitarbeiter(
    @Param('mid', ParseIntPipe) mid: number,
  ) {
    return this.service.einsaetzeFuerMitarbeiterLaden(mid);
  }
  @Post() einsatzErstellen(@Body() b: CreateHausmeisterEinsatzDto) {
    return this.service.einsatzErstellen(b);
  }
  @Put(':id') einsatzAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: UpdateHausmeisterEinsatzDto,
  ) {
    return this.service.einsatzAktualisieren(id, b);
  }
  @Delete(':id') einsatzLoeschen(@Param('id', ParseIntPipe) id: number) {
    return this.service.einsatzLoeschen(id);
  }
}
