import type { OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class BenachrichtigungenScheduler implements OnModuleInit {
  private readonly logger = new Logger(BenachrichtigungenScheduler.name);
  private _running = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    void this.benachrichtigungenPruefen();
    setInterval(
      () => void this.benachrichtigungenPruefen(),
      6 * 60 * 60 * 1000,
    );
  }

  async benachrichtigungenPruefen(): Promise<void> {
    if (this._running) return;
    this._running = true;
    try {
      const heute = new Date();
      heute.setHours(0, 0, 0, 0);
      const in3Tagen = new Date(heute);
      in3Tagen.setDate(in3Tagen.getDate() + 3);
      const in2Tagen = new Date(heute);
      in2Tagen.setDate(in2Tagen.getDate() + 2);

      // Fetch all candidates in parallel
      const [ueberfaellig, baldFaellig, muellTermine, ablaufend] =
        await Promise.all([
          this.prisma.rechnungen.findMany({
            where: { bezahlt: false, frist: { lt: heute } },
            select: { nr: true, empf: true, brutto: true, frist: true },
          }),
          this.prisma.rechnungen.findMany({
            where: { bezahlt: false, frist: { gte: heute, lte: in3Tagen } },
            select: { nr: true, empf: true, frist: true },
          }),
          this.prisma.muellplan.findMany({
            where: { abholung: { gte: heute, lte: in2Tagen }, erledigt: false },
            include: { objekte: { select: { name: true } } },
          }),
          this.prisma.angebote.findMany({
            where: {
              angenommen: false,
              abgelehnt: false,
              gueltig_bis: { gte: heute, lte: in3Tagen },
            },
            select: { nr: true, empf: true, gueltig_bis: true },
          }),
        ]);

      // Build candidate notification titles
      const candidateTitles = [
        ...ueberfaellig.map((r) => `Rechnung ${r.nr} überfällig`),
        ...baldFaellig.map((r) => `Rechnung ${r.nr} bald fällig`),
        ...muellTermine.map((t) => `Mülltermin: ${t.muellart}`),
        ...ablaufend.map((a) => `Angebot ${a.nr} läuft ab`),
      ];

      if (candidateTitles.length === 0) {
        this.logger.debug('Benachrichtigungs-Check: keine Kandidaten');
        return;
      }

      // One query to find already-existing unread notifications
      const vorhandene = await this.prisma.benachrichtigungen.findMany({
        where: { titel: { in: candidateTitles }, gelesen: false },
        select: { titel: true },
      });
      const vorhandeneSet = new Set(vorhandene.map((n) => n.titel));

      const neueNachrichten: {
        typ: string;
        titel: string;
        nachricht: string;
        link: string;
      }[] = [];

      for (const r of ueberfaellig) {
        const titel = `Rechnung ${r.nr} überfällig`;
        if (!vorhandeneSet.has(titel)) {
          neueNachrichten.push({
            typ: 'rechnung',
            titel,
            nachricht: `${r.empf} – ${Number(r.brutto).toFixed(2)} € – fällig seit ${r.frist?.toISOString().slice(0, 10)}`,
            link: '/rechnungen',
          });
        }
      }

      for (const r of baldFaellig) {
        const titel = `Rechnung ${r.nr} bald fällig`;
        if (!vorhandeneSet.has(titel)) {
          neueNachrichten.push({
            typ: 'rechnung',
            titel,
            nachricht: `${r.empf} – fällig am ${r.frist?.toISOString().slice(0, 10)}`,
            link: '/rechnungen',
          });
        }
      }

      for (const t of muellTermine) {
        const titel = `Mülltermin: ${t.muellart}`;
        if (!vorhandeneSet.has(titel)) {
          neueNachrichten.push({
            typ: 'muellplan',
            titel,
            nachricht: `${t.objekte.name} – Rausstellen am ${t.abholung.toISOString().slice(0, 10)}`,
            link: '/muellplan',
          });
        }
      }

      for (const a of ablaufend) {
        const titel = `Angebot ${a.nr} läuft ab`;
        if (!vorhandeneSet.has(titel)) {
          neueNachrichten.push({
            typ: 'angebot',
            titel,
            nachricht: `${a.empf} – gültig bis ${a.gueltig_bis?.toISOString().slice(0, 10)}`,
            link: '/angebote',
          });
        }
      }

      if (neueNachrichten.length > 0) {
        await this.prisma.benachrichtigungen.createMany({
          data: neueNachrichten,
        });
        this.logger.log(`${neueNachrichten.length} neue Benachrichtigungen erstellt`);
      }

      // Clean up old read notifications (>30 days) — safe to delete, not audit records
      const vor30Tagen = new Date();
      vor30Tagen.setDate(vor30Tagen.getDate() - 30);
      await this.prisma.benachrichtigungen.deleteMany({
        where: { gelesen: true, erstellt_am: { lt: vor30Tagen } },
      });

      this.logger.debug('Benachrichtigungs-Check abgeschlossen');
    } catch (e) {
      this.logger.warn(
        `Benachrichtigungs-Check fehlgeschlagen: ${(e as Error).message}`,
      );
    } finally {
      this._running = false;
    }
  }
}
