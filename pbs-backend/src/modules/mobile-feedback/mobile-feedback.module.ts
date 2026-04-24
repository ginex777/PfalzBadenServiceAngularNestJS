import { Module } from '@nestjs/common';
import { MobileFeedbackController } from './mobile-feedback.controller';
import { MobileFeedbackService } from './mobile-feedback.service';

@Module({
  controllers: [MobileFeedbackController],
  providers: [MobileFeedbackService],
})
export class MobileFeedbackModule {}
