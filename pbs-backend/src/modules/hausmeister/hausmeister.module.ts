import { Module } from '@nestjs/common';
import { HausmeisterController } from './hausmeister.controller';
import { HausmeisterService } from './hausmeister.service';

@Module({
  controllers: [HausmeisterController],
  providers: [HausmeisterService],
})
export class HausmeisterModule {}
