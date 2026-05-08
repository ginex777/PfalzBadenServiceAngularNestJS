import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async einstellungenLaden(schluessel: string) {
    const row = await this.prisma.settings.findUnique({
      where: { key: schluessel },
    });
    try {
      return row ? JSON.parse(row.value) : {};
    } catch (e) {
      this.logger.error(
        e instanceof Error ? e.message : String(e),
        e instanceof Error ? e.stack : undefined,
      );
      return {};
    }
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
