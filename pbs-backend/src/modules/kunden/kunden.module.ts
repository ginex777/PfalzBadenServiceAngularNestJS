import { Module } from '@nestjs/common';
import { KundenController } from './kunden.controller';
import { KundenService } from './kunden.service';
import { AuditService } from '../../core/audit/audit.service';

@Module({ controllers: [KundenController], providers: [KundenService, AuditService] })
export class KundenModule {}
