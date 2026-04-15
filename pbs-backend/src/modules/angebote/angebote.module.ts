import { Module } from '@nestjs/common';
import { AngeboteController } from './angebote.controller';
import { AngeboteService } from './angebote.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AngeboteController],
  providers: [AngeboteService],
})
export class AngeboteModule {}
