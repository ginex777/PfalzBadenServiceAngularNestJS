import { Module } from '@nestjs/common';
import { KundenController } from './kunden.controller';
import { KundenService } from './kunden.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [KundenController],
  providers: [KundenService],
})
export class KundenModule {}
