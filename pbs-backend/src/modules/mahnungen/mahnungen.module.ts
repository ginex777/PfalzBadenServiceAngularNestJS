import { Module } from '@nestjs/common';
import { MahnungenController } from './mahnungen.controller';
import { PdfModule } from '../pdf/pdf.module';

@Module({ 
  imports: [PdfModule],
  controllers: [MahnungenController] 
})
export class MahnungenModule {}
