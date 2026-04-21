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
import { MarketingService } from './marketing.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('api/marketing')
export class MarketingController {
  constructor(private readonly service: MarketingService) {}
  @Get() alleKontakteLaden(@Query() pagination: PaginationDto) {
    return this.service.alleKontakteLaden(pagination);
  }
  @Post() kontaktErstellen(@Body() b: Record<string, unknown>) {
    return this.service.kontaktErstellen(b);
  }
  @Put(':id') kontaktAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: Record<string, unknown>,
  ) {
    return this.service.kontaktAktualisieren(id, b);
  }
  @Delete(':id') kontaktLoeschen(@Param('id', ParseIntPipe) id: number) {
    return this.service.kontaktLoeschen(id);
  }
}
