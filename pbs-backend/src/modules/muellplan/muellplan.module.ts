import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MuellplanController } from './muellplan.controller';
import { MuellplanService } from './muellplan.service';

@Module({
  imports: [MulterModule.register({ storage: memoryStorage() })],
  controllers: [MuellplanController],
  providers: [MuellplanService],
})
export class MuellplanModule {}
