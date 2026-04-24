import { Module } from '@nestjs/common';
import { ObjekteController } from './objekte.controller';
import { ObjekteService } from './objekte.service';

@Module({
  controllers: [ObjekteController],
  providers: [ObjekteService],
})
export class ObjekteModule {}
