import { Module } from '@nestjs/common';
import { ObjekteController } from './objekte.controller';
import { ObjekteService } from './objekte.service';
import { AccessPolicyModule } from '../access-policy/access-policy.module';

@Module({
  imports: [AccessPolicyModule],
  controllers: [ObjekteController],
  providers: [ObjekteService],
})
export class ObjekteModule {}
