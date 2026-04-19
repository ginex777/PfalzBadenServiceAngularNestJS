import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface PdfToken { pdf: Buffer; filename: string; }

@Injectable()
export class PdfTokenService {
  private readonly logger = new Logger(PdfTokenService.name);
  private readonly tokenStore = new Map<string, { data: PdfToken; expires: number }>();

  constructor() {
    setInterval(() => this.abgelaufeneTokensLoeschen(), 60_000);
  }

  tokenErstellen(pdf: Buffer, filename: string): { token: string; url: string } {
    const token = crypto.randomBytes(8).toString('hex');
    this.tokenStore.set(token, { data: { pdf, filename }, expires: Date.now() + 5 * 60 * 1000 });
    const safeFilename = encodeURIComponent(filename.replace(/[^\w\-äöüÄÖÜß.]/g, '_'));
    return { token, url: `/api/pdf/view/${token}/${safeFilename}` };
  }

  tokenAbrufen(token: string): PdfToken | null {
    const entry = this.tokenStore.get(token);
    if (!entry || entry.expires < Date.now()) { this.tokenStore.delete(token); return null; }
    return entry.data;
  }

  private abgelaufeneTokensLoeschen(): void {
    const now = Date.now();
    for (const [key, val] of this.tokenStore) {
      if (val.expires < now) this.tokenStore.delete(key);
    }
    this.logger.debug('Token-Store bereinigt');
  }
}
