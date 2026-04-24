import { Module } from '@nestjs/common';
import { ChecklistenController } from './checklisten.controller';
import { ChecklistenService } from './checklisten.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule],
  controllers: [ChecklistenController],
  providers: [ChecklistenService],
})
export class ChecklistenModule {}
