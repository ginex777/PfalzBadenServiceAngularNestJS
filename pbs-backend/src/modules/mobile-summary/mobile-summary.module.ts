import { Module } from '@nestjs/common';
import { AccessPolicyModule } from '../access-policy/access-policy.module';
import { MobileSummaryController } from './mobile-summary.controller';
import { MobileSummaryService } from './mobile-summary.service';

@Module({
  imports: [AccessPolicyModule],
  controllers: [MobileSummaryController],
  providers: [MobileSummaryService],
})
export class MobileSummaryModule {}
