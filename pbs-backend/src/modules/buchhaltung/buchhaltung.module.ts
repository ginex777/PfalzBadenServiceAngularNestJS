import { Module } from '@nestjs/common';
import { BuchhaltungController } from './buchhaltung.controller';
import { BuchhaltungService } from './buchhaltung.service';

@Module({
  controllers: [BuchhaltungController],
  providers: [BuchhaltungService],
})
export class BuchhaltungModule {}
