import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { StempeluhrService } from './stempeluhr.service';
import type {
  ListStempeluhrQueryDto,
  StempeluhrListResponseDto,
} from './dto/stempeluhr.dto';
import type { AuthRequest } from '../auth/auth-request.type';

@ApiTags('Stempeluhr')
@ApiSecurity('x-nutzer')
@Roles('admin', 'readonly')
@Controller('api/stempeluhr')
export class StempeluhrController {
  constructor(private readonly stempeluhrService: StempeluhrService) {}

  @Get()
  async list(
    @Query() query: ListStempeluhrQueryDto,
    @Req() req: AuthRequest,
  ): Promise<StempeluhrListResponseDto> {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.stempeluhrService.list(query, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }
}
