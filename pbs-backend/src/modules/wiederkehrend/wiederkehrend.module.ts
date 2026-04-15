import { Module } from '@nestjs/common';
import { WiederkehrendController } from './wiederkehrend.controller';
import { WiederkehrendService } from './wiederkehrend.service';
import { WiederkehrendScheduler } from './wiederkehrend.scheduler';
import { AuditModule } from '../audit/audit.module';

@Module({ 
  imports: [AuditModule],
  controllers: [WiederkehrendController], 
  providers: [WiederkehrendService, WiederkehrendScheduler] 
})
export class WiederkehrendModule {}
