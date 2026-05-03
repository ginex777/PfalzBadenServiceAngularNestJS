import { Module } from '@nestjs/common';
import { MitarbeiterController } from './mitarbeiter.controller';
import { MitarbeiterService } from './mitarbeiter.service';
import { TasksModule } from '../tasks/tasks.module';
import { AccessPolicyModule } from '../access-policy/access-policy.module';

@Module({
  imports: [TasksModule, AccessPolicyModule],
  controllers: [MitarbeiterController],
  providers: [MitarbeiterService],
})
export class MitarbeiterModule {}
