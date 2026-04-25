import { Module } from '@nestjs/common';
import { StempeluhrController } from './stempeluhr.controller';
import { StempeluhrService } from './stempeluhr.service';

@Module({
  controllers: [StempeluhrController],
  providers: [StempeluhrService],
  exports: [StempeluhrService],
})
export class StempeluhrModule {}
