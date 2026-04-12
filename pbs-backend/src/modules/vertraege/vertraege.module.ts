import { Module } from '@nestjs/common';
import { VertraegeController } from './vertraege.controller';
import { VertraegeService } from './vertraege.service';
import { DatabaseModule } from '../../core/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [DatabaseModule, AuditModule, PdfModule],
  controllers: [VertraegeController],
  providers: [VertraegeService],
})
export class VertraegeModule {}
