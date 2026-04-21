import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { Prisma } from '@prisma/client';

type WiederkehrendeRechnungRow = {
  id: bigint;
  kunden_id: bigint | null;
  kunden_name: string | null;
  positionen: Prisma.JsonValue;
  intervall: string;
  letzte_erstellung: Date | null;
};

@Injectable()
export class WiederkehrendScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(WiederkehrendScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  onApplicationBootstrap(): void {
    // 5s delay to ensure DB connection is established before first run
    const initial = setTimeout(() => void this.createRecurringInvoices(), 5000);
    initial.unref?.();

    // Täglich um 6:00 Uhr ausführen
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(6, 0, 0, 0);

    // Wenn es bereits nach 6:00 Uhr ist, nächsten Tag
    if (now.getTime() > nextRun.getTime()) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const msUntilNextRun = nextRun.getTime() - now.getTime();

    const timer = setTimeout(() => {
      void this.createRecurringInvoices();
      // Dann alle 24 Stunden
      const interval = setInterval(
        () => void this.createRecurringInvoices(),
        24 * 60 * 60 * 1000,
      );
      interval.unref?.();
    }, msUntilNextRun);
    timer.unref?.();
  }

  async createRecurringInvoices(): Promise<void> {
    try {
      const heute = new Date();
      heute.setHours(0, 0, 0, 0);

      // Alle aktiven wiederkehrenden Rechnungen laden
      const wiederkehrende: WiederkehrendeRechnungRow[] =
        await this.prisma.wiederkehrendeRechnungen.findMany({
          where: { aktiv: true },
        });

      let erstellteRechnungen = 0;

      for (const wr of wiederkehrende) {
        const sollErstellt = this.shouldCreateInvoice(wr, heute);

        if (sollErstellt) {
          try {
            if (!wr.kunden_id) {
              this.logger.error(
                `Wiederkehrende Rechnung ohne kunden_id übersprungen (id=${String(wr.id)})`,
              );
              continue;
            }

            // Neue Rechnung erstellen
            const neueRechnung = await this.prisma.rechnungen.create({
              data: {
                kunden_id: wr.kunden_id,
                empf: wr.kunden_name || 'Unbekannt',
                nr: await this.nextInvoiceNumber(),
                datum: heute,
                frist: this.calculateDueDate(heute),
                positionen: wr.positionen as Prisma.InputJsonValue,
                bezahlt: false,
              },
            });

            // Letzte Erstellung aktualisieren
            await this.prisma.wiederkehrendeRechnungen.update({
              where: { id: wr.id },
              data: { letzte_erstellung: heute },
            });

            await this.auditService.log(
              'rechnungen',
              Number(neueRechnung.id),
              'CREATE',
              null,
              { nr: neueRechnung.nr, empf: neueRechnung.empf },
              'System',
              'System (Wiederkehrend)',
            );

            erstellteRechnungen++;
            this.logger.log(
              `Wiederkehrende Rechnung erstellt: ${neueRechnung.nr} für ${wr.kunden_name}`,
            );
          } catch (error) {
            this.logger.error(
              `Fehler beim Erstellen der wiederkehrenden Rechnung für ${wr.kunden_name}: ${error}`,
            );
          }
        }
      }

      if (erstellteRechnungen > 0) {
        this.logger.log(
          `${erstellteRechnungen} wiederkehrende Rechnungen erstellt`,
        );
      } else {
        this.logger.debug('Keine wiederkehrenden Rechnungen zu erstellen');
      }
    } catch (error) {
      this.logger.error(
        'Fehler beim Prüfen wiederkehrender Rechnungen: ' +
          (error as Error).message,
      );
    }
  }

  private shouldCreateInvoice(
    wr: WiederkehrendeRechnungRow,
    heute: Date,
  ): boolean {
    if (!wr.letzte_erstellung) {
      // Noch nie erstellt - erstellen
      return true;
    }

    const letzteErstellung = new Date(wr.letzte_erstellung);
    letzteErstellung.setHours(0, 0, 0, 0);

    const differenzTage = Math.floor(
      (heute.getTime() - letzteErstellung.getTime()) / (1000 * 60 * 60 * 24),
    );

    switch (wr.intervall) {
      case 'monatlich': {
        // FIXED: Prevent duplicate monthly invoices - require at least 25 days gap
        const monatVerschieden =
          letzteErstellung.getMonth() !== heute.getMonth() ||
          letzteErstellung.getFullYear() !== heute.getFullYear();
        return monatVerschieden && differenzTage >= 25;
      }

      case 'woechentlich':
        return differenzTage >= 7;

      case 'taeglich':
        return differenzTage >= 1;

      case 'jaehrlich':
        return (
          letzteErstellung.getFullYear() !== heute.getFullYear() &&
          differenzTage >= 360
        );

      default:
        return false;
    }
  }

  private async nextInvoiceNumber(): Promise<string> {
    const jahr = new Date().getFullYear();
    const prefix = `R${jahr}`;

    const letzteRechnung = await this.prisma.rechnungen.findFirst({
      where: { nr: { startsWith: prefix } },
      orderBy: { nr: 'desc' },
    });

    if (!letzteRechnung) {
      return `${prefix}-001`;
    }

    const letzteNummer = parseInt(letzteRechnung.nr.split('-')[1] || '0');
    const naechsteNummer = letzteNummer + 1;

    return `${prefix}-${naechsteNummer.toString().padStart(3, '0')}`;
  }

  private calculateDueDate(datum: Date): Date {
    const frist = new Date(datum);
    frist.setDate(frist.getDate() + 14); // 14 Tage Zahlungsfrist
    return frist;
  }
}
