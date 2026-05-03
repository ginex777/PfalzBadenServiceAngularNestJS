import { Module } from '@nestjs/common';
import { HausmeisterController } from './hausmeister.controller';
import { HausmeisterService } from './hausmeister.service';
import { AccessPolicyModule } from '../access-policy/access-policy.module';

@Module({
  imports: [AccessPolicyModule],
  controllers: [HausmeisterController],
  providers: [HausmeisterService],
})
export class HausmeisterModule {}
