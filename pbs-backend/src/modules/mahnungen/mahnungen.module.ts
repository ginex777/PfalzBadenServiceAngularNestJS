import { Module } from '@nestjs/common';
import { MahnungenController } from './mahnungen.controller';
import { MahnungenService } from './mahnungen.service';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  controllers: [MahnungenController],
  providers: [MahnungenService],
})
export class MahnungenModule {}
