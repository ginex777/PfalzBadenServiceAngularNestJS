import { Module } from '@nestjs/common';
import { BenachrichtigungenController } from './benachrichtigungen.controller';
import { BenachrichtigungenScheduler } from './benachrichtigungen.scheduler';

@Module({
  controllers: [BenachrichtigungenController],
  providers: [BenachrichtigungenScheduler],
})
export class BenachrichtigungenModule {}
