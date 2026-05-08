import { Module } from '@nestjs/common';
import { BuchhaltungController } from './buchhaltung.controller';
import { BuchhaltungService } from './buchhaltung.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [BuchhaltungController],
  providers: [BuchhaltungService],
})
export class BuchhaltungModule {}
