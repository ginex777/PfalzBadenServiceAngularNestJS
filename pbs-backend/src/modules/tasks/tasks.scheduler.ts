import type { OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { TasksService } from './tasks.service';

@Injectable()
export class TasksScheduler implements OnModuleInit {
  private readonly logger = new Logger(TasksScheduler.name);

  constructor(private readonly tasksService: TasksService) {}

  onModuleInit(): void {
    // Run once on startup, then every 24h.
    void this.run();
    const timer = setInterval(() => void this.run(), 24 * 60 * 60 * 1000);
    timer.unref();
  }

  private async run(): Promise<void> {
    try {
      await this.tasksService.syncMuellplanTasks();
      this.logger.debug('Task sync completed');
    } catch (e) {
      this.logger.warn(`Task sync failed: ${(e as Error).message}`);
    }
  }
}
