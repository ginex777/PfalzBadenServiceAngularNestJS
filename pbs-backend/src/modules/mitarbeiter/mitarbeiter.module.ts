import { Module } from '@nestjs/common';
import { MitarbeiterController } from './mitarbeiter.controller';
import { MitarbeiterService } from './mitarbeiter.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule],
  controllers: [MitarbeiterController],
  providers: [MitarbeiterService],
})
export class MitarbeiterModule {}
