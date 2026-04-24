import { Module } from '@nestjs/common';
import { ChecklistenController } from './checklisten.controller';
import { ChecklistenService } from './checklisten.service';

@Module({
  controllers: [ChecklistenController],
  providers: [ChecklistenService],
})
export class ChecklistenModule {}

