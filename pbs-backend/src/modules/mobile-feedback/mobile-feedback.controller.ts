import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { MobileFeedbackQueryDto } from './dto/mobile-feedback.dto';
import { MobileFeedbackService } from './mobile-feedback.service';

@Controller('api/mobile-feedback')
export class MobileFeedbackController {
  constructor(private readonly service: MobileFeedbackService) {}

  @Get()
  @Roles('admin', 'readonly', 'mitarbeiter')
  list(@Query() query: MobileFeedbackQueryDto) {
    return this.service.list({
      page: query.page,
      pageSize: query.pageSize,
      objectId: query.objectId,
    });
  }
}

