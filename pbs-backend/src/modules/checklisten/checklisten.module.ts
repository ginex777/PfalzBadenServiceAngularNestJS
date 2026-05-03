import { Module } from '@nestjs/common';
import { ChecklistenController } from './checklisten.controller';
import { ChecklistenService } from './checklisten.service';
import { TasksModule } from '../tasks/tasks.module';
import { AccessPolicyModule } from '../access-policy/access-policy.module';

@Module({
  imports: [TasksModule, AccessPolicyModule],
  controllers: [ChecklistenController],
  providers: [ChecklistenService],
})
export class ChecklistenModule {}
