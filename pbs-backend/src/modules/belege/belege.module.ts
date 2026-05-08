import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BelegeController } from './belege.controller';
import { BelegeService } from './belege.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
    AuditModule,
  ],
  controllers: [BelegeController],
  providers: [BelegeService],
})
export class BelegeModule {}
