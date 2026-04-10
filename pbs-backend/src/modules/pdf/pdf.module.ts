import { Module } from '@nestjs/common';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { PuppeteerService } from './puppeteer.service';

@Module({
  controllers: [PdfController],
  providers: [PdfService, PuppeteerService],
  exports: [PdfService],
})
export class PdfModule {}
