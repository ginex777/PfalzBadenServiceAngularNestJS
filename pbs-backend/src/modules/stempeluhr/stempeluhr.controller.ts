import { Controller, Get, Query } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { StempeluhrService } from './stempeluhr.service';
import {
  ListStempeluhrQueryDto,
  StempeluhrListResponseDto,
} from './dto/stempeluhr.dto';

@ApiTags('Stempeluhr')
@ApiSecurity('x-nutzer')
@Roles('admin', 'readonly')
@Controller('stempeluhr')
export class StempeluhrController {
  constructor(private readonly stempeluhrService: StempeluhrService) {}

  @Get()
  async list(
    @Query() query: ListStempeluhrQueryDto,
  ): Promise<StempeluhrListResponseDto> {
    return this.stempeluhrService.list(query);
  }
}
