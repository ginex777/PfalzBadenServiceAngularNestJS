import { Module } from '@nestjs/common';
import { RechnungenController } from './rechnungen.controller';
import { RechnungenService } from './rechnungen.service';
import { AuditService } from '../../core/audit/audit.service';

@Module({ controllers: [RechnungenController], providers: [RechnungenService, AuditService] })
export class RechnungenModule {}
