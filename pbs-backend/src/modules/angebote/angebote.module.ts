import { Module } from '@nestjs/common';
import { AngeboteController } from './angebote.controller';
import { AngeboteService } from './angebote.service';
import { AuditService } from '../../modules/audit/audit.service';

@Module({ controllers: [AngeboteController], providers: [AngeboteService, AuditService] })
export class AngeboteModule {}
