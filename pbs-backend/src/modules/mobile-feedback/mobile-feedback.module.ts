import { Module } from '@nestjs/common';
import { MobileFeedbackController } from './mobile-feedback.controller';
import { MobileFeedbackService } from './mobile-feedback.service';
import { AccessPolicyModule } from '../access-policy/access-policy.module';

@Module({
  imports: [AccessPolicyModule],
  controllers: [MobileFeedbackController],
  providers: [MobileFeedbackService],
})
export class MobileFeedbackModule {}
