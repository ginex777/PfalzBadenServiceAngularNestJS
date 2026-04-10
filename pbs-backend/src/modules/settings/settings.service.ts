import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async einstellungenLaden(schluessel: string) {
    const row = await this.prisma.settings.findUnique({ where: { key: schluessel } });
    try { return row ? JSON.parse(row.value) : {}; } catch { return {}; }
  }

  async einstellungenSpeichern(schluessel: string, daten: unknown) {
    await this.prisma.settings.upsert({
      where: { key: schluessel },
      create: { key: schluessel, value: JSON.stringify(daten) },
      update: { value: JSON.stringify(daten) },
    });
    return this.einstellungenLaden(schluessel);
  }
}
