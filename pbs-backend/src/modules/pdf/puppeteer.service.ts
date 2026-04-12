import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PuppeteerService.name);
  private browser!: Browser;

  async onModuleInit(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    this.logger.log('Puppeteer Browser gestartet (Singleton)');
  }

  async onModuleDestroy(): Promise<void> {
    await this.browser?.close();
    this.logger.log('Puppeteer Browser beendet');
  }

  async htmlZuPdf(html: string): Promise<Buffer> {
    const page = await this.browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        // These margins match the @page CSS rules in all templates.
        // The fixed header/footer expand into these reserved bands.
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }
}
