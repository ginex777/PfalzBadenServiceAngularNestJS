import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  Req,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthRequest } from '../auth/auth-request.type';
import { MobileSummaryService } from './mobile-summary.service';

@Controller('api/mobile')
export class MobileSummaryController {
  constructor(private readonly service: MobileSummaryService) {}

  @Get('dashboard-summary')
  @Roles('admin', 'mitarbeiter')
  async dashboardSummary(
    @Req() req: AuthRequest,
    @Query('objectId') objectId?: string,
    @Query('limit', new DefaultValuePipe(6), ParseIntPipe) limit?: number,
  ) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    const parsedObjectId = this.parseOptionalObjectId(objectId);
    return this.service.dashboardSummary({
      auth: {
        role: user.rolle,
        employeeId: user.mitarbeiterId ?? null,
      },
      objectId: parsedObjectId,
      pickupLimit: Math.min(Math.max(limit ?? 6, 1), 30),
    });
  }

  private parseOptionalObjectId(value: string | undefined): number | null {
    if (value == null || value.trim() === '') return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException('Invalid objectId');
    }
    return parsed;
  }
}
