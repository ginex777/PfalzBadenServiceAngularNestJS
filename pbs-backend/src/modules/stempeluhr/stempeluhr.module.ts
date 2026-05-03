import { Module } from '@nestjs/common';
import { StempeluhrController } from './stempeluhr.controller';
import { StempeluhrService } from './stempeluhr.service';
import { AccessPolicyModule } from '../access-policy/access-policy.module';

@Module({
  imports: [AccessPolicyModule],
  controllers: [StempeluhrController],
  providers: [StempeluhrService],
  exports: [StempeluhrService],
})
export class StempeluhrModule {}
