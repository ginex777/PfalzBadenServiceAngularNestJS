import { Module } from '@nestjs/common';
import { BenachrichtigungenController } from './benachrichtigungen.controller';
import { BenachrichtigungenScheduler } from './benachrichtigungen.scheduler';
import { BenachrichtigungenService } from './benachrichtigungen.service';

@Module({
  controllers: [BenachrichtigungenController],
  providers: [BenachrichtigungenScheduler, BenachrichtigungenService],
})
export class BenachrichtigungenModule {}
