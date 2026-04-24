import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { NachweiseController } from './nachweise.controller';
import { NachweiseService } from './nachweise.service';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  ],
  controllers: [NachweiseController],
  providers: [NachweiseService],
})
export class NachweiseModule {}

