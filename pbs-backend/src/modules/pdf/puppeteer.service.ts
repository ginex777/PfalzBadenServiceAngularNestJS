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

  async htmlZuPdf(html: string, opts: {
    headerTemplate?: string;
    footerTemplate?: string;
    margin?: { top?: string; right?: string; bottom?: string; left?: string };
  } = {}): Promise<Buffer> {
    const page = await this.browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const hasHeaders = !!(opts.headerTemplate || opts.footerTemplate);
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: hasHeaders,
        headerTemplate: opts.headerTemplate ?? '<div></div>',
        footerTemplate: opts.footerTemplate ?? '<div></div>',
        margin: opts.margin ?? (hasHeaders
          ? { top: '34mm', right: '0mm', bottom: '30mm', left: '0mm' }
          : { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }),
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }
}
