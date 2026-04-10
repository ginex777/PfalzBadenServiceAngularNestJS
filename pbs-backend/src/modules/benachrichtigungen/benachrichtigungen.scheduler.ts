import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class BenachrichtigungenScheduler implements OnModuleInit {
  private readonly logger = new Logger(BenachrichtigungenScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    // Beim Start sofort ausführen, dann alle 6h
    void this.benachrichtigungenPruefen();
    setInterval(() => void this.benachrichtigungenPruefen(), 6 * 60 * 60 * 1000);
  }

  async benachrichtigungenPruefen(): Promise<void> {
    try {
      const heute = new Date(); heute.setHours(0, 0, 0, 0);
      const in3Tagen = new Date(heute); in3Tagen.setDate(in3Tagen.getDate() + 3);
      const in2Tagen = new Date(heute); in2Tagen.setDate(in2Tagen.getDate() + 2);

      // 1. Überfällige Rechnungen
      const ueberfaellig = await this.prisma.rechnungen.findMany({
        where: { bezahlt: false, frist: { lt: heute } },
        select: { nr: true, empf: true, brutto: true, frist: true },
      });
      for (const r of ueberfaellig) {
        const vorhanden = await this.prisma.benachrichtigungen.findFirst({ where: { titel: { contains: r.nr }, gelesen: false } });
        if (!vorhanden) {
          await this.prisma.benachrichtigungen.create({
            data: { typ: 'rechnung', titel: `Rechnung ${r.nr} überfällig`, nachricht: `${r.empf} – ${Number(r.brutto).toFixed(2)} € – fällig seit ${r.frist?.toISOString().slice(0, 10)}`, link: `/rechnungen` },
          });
        }
      }

      // 2. Rechnungen fällig in 3 Tagen
      const baldFaellig = await this.prisma.rechnungen.findMany({
        where: { bezahlt: false, frist: { gte: heute, lte: in3Tagen } },
        select: { nr: true, empf: true, frist: true },
      });
      for (const r of baldFaellig) {
        const vorhanden = await this.prisma.benachrichtigungen.findFirst({ where: { titel: { contains: r.nr }, gelesen: false } });
        if (!vorhanden) {
          await this.prisma.benachrichtigungen.create({
            data: { typ: 'rechnung', titel: `Rechnung ${r.nr} bald fällig`, nachricht: `${r.empf} – fällig am ${r.frist?.toISOString().slice(0, 10)}`, link: `/rechnungen` },
          });
        }
      }

      // 3. Mülltermine in 2 Tagen
      const muellTermine = await this.prisma.muellplan.findMany({
        where: { abholung: { gte: heute, lte: in2Tagen }, erledigt: false },
        include: { objekte: { select: { name: true } } },
      });
      for (const t of muellTermine) {
        const vorhanden = await this.prisma.benachrichtigungen.findFirst({ where: { titel: { contains: t.objekte.name }, gelesen: false } });
        if (!vorhanden) {
          await this.prisma.benachrichtigungen.create({
            data: { typ: 'muellplan', titel: `Mülltermin: ${t.muellart}`, nachricht: `${t.objekte.name} – Rausstellen am ${t.abholung.toISOString().slice(0, 10)}`, link: `/muellplan` },
          });
        }
      }

      // 4. Angebote ablaufend in 3 Tagen
      const ablaufend = await this.prisma.angebote.findMany({
        where: { angenommen: false, abgelehnt: false, gueltig_bis: { gte: heute, lte: in3Tagen } },
        select: { nr: true, empf: true, gueltig_bis: true },
      });
      for (const a of ablaufend) {
        const vorhanden = await this.prisma.benachrichtigungen.findFirst({ where: { titel: { contains: a.nr }, gelesen: false } });
        if (!vorhanden) {
          await this.prisma.benachrichtigungen.create({
            data: { typ: 'angebot', titel: `Angebot ${a.nr} läuft ab`, nachricht: `${a.empf} – gültig bis ${a.gueltig_bis?.toISOString().slice(0, 10)}`, link: `/angebote` },
          });
        }
      }

      // Alte gelesene Benachrichtigungen bereinigen (>30 Tage)
      const vor30Tagen = new Date(); vor30Tagen.setDate(vor30Tagen.getDate() - 30);
      await this.prisma.benachrichtigungen.deleteMany({ where: { gelesen: true, erstellt_am: { lt: vor30Tagen } } });

      this.logger.debug('Benachrichtigungs-Check abgeschlossen');
    } catch (e) {
      this.logger.warn('Benachrichtigungs-Check fehlgeschlagen: ' + (e as Error).message);
    }
  }
}
