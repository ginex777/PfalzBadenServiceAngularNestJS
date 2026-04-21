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
import {
  CreateMarketingKontaktDto,
  UpdateMarketingKontaktDto,
} from './dto/marketing.dto';

@Controller('api/marketing')
export class MarketingController {
  constructor(private readonly service: MarketingService) {}
  @Get() alleKontakteLaden(@Query() pagination: PaginationDto) {
    return this.service.alleKontakteLaden(pagination);
  }
  @Post() kontaktErstellen(@Body() b: CreateMarketingKontaktDto) {
    return this.service.kontaktErstellen(b);
  }
  @Put(':id') kontaktAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: UpdateMarketingKontaktDto,
  ) {
    return this.service.kontaktAktualisieren(id, b);
  }
  @Delete(':id') kontaktLoeschen(@Param('id', ParseIntPipe) id: number) {
    return this.service.kontaktLoeschen(id);
  }
}
