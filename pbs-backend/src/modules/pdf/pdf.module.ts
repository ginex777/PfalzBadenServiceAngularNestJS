import { Module } from '@nestjs/common';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { PuppeteerService } from './puppeteer.service';
import { PdfTokenService } from './pdf-token.service';
import { PdfRenderService } from './pdf-render.service';
import { RechnungPdfGenerator } from './generators/rechnung-pdf.generator';
import { AngebotPdfGenerator } from './generators/angebot-pdf.generator';
import { MahnungPdfGenerator } from './generators/mahnung-pdf.generator';
import { EuerPdfGenerator } from './generators/euer-pdf.generator';
import { HausmeisterPdfGenerator } from './generators/hausmeister-pdf.generator';
import { MitarbeiterPdfGenerator } from './generators/mitarbeiter-pdf.generator';
import { VertragPdfGenerator } from './generators/vertrag-pdf.generator';
import { ChecklistePdfGenerator } from './generators/checkliste-pdf.generator';

@Module({
  controllers: [PdfController],
  providers: [
    PdfService,
    PuppeteerService,
    PdfTokenService,
    PdfRenderService,
    RechnungPdfGenerator,
    AngebotPdfGenerator,
    MahnungPdfGenerator,
    EuerPdfGenerator,
    HausmeisterPdfGenerator,
    MitarbeiterPdfGenerator,
    VertragPdfGenerator,
    ChecklistePdfGenerator,
  ],
  exports: [PdfService],
})
export class PdfModule {}
