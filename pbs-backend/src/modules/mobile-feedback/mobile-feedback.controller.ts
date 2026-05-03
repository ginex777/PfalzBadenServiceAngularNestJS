import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import type { MobileFeedbackQueryDto } from './dto/mobile-feedback.dto';
import type { MobileFeedbackService } from './mobile-feedback.service';
import type { AuthRequest } from '../auth/auth-request.type';

@Controller('api/mobile-feedback')
export class MobileFeedbackController {
  constructor(private readonly service: MobileFeedbackService) {}

  @Get()
  @Roles('admin', 'readonly')
  list(@Query() query: MobileFeedbackQueryDto, @Req() req: AuthRequest) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.list({
      page: query.page,
      pageSize: query.pageSize,
      objectId: query.objectId,
      auth: { role: user.rolle, employeeId: user.mitarbeiterId ?? null },
    });
  }
}
