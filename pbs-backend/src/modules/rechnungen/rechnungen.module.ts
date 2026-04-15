import { Module } from '@nestjs/common';
import { RechnungenController } from './rechnungen.controller';
import { RechnungenService } from './rechnungen.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [RechnungenController],
  providers: [RechnungenService],
})
export class RechnungenModule {}
