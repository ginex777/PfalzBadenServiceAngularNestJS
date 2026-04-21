import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async kpis() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const [monthlyRevenue, outstanding, overdueCount, hausmeisterHours] =
      await Promise.all([
        this.prisma.rechnungen.aggregate({
          where: {
            bezahlt: true,
            bezahlt_am: { gte: monthStart, lte: monthEnd },
          },
          _sum: { brutto: true },
        }),
        this.prisma.rechnungen.aggregate({
          where: { bezahlt: false },
          _sum: { brutto: true },
        }),
        this.prisma.rechnungen.count({
          where: { bezahlt: false, frist: { lt: now } },
        }),
        this.prisma.hausmeisterEinsaetze.aggregate({
          where: { datum: { gte: monthStart, lte: monthEnd } },
          _sum: { stunden_gesamt: true },
        }),
      ]);

    return {
      monthlyRevenue: Number(monthlyRevenue._sum.brutto ?? 0),
      outstandingTotal: Number(outstanding._sum.brutto ?? 0),
      overdueCount,
      hausmeisterHours: Number(hausmeisterHours._sum.stunden_gesamt ?? 0),
    };
  }

  async activity() {
    const rows = await this.prisma.auditLog.findMany({
      orderBy: { zeitstempel: 'desc' },
      take: 10,
    });
    return rows.map((r) => {
      const wert = (r.neu_wert ?? r.alt_wert) as Record<string, unknown> | null;
      return {
        id: Number(r.id),
        tabelle: r.tabelle,
        aktion: r.aktion,
        zeitstempel: r.zeitstempel,
        nutzer: r.nutzer_name ?? r.nutzer ?? '–',
        datensatzId: Number(r.datensatz_id),
        nr: wert?.['nr'] as string | undefined,
        empf: wert?.['empf'] as string | undefined,
        brutto: wert?.['brutto'] != null ? Number(wert['brutto']) : undefined,
      };
    });
  }

  async revenueTrend(months: number) {
    const now = new Date();
    const results = await Promise.all(
      Array.from({ length: months }, (_, i) => {
        const d = new Date(
          now.getFullYear(),
          now.getMonth() - (months - 1 - i),
          1,
        );
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        return this.prisma.rechnungen
          .aggregate({
            where: { bezahlt: true, bezahlt_am: { gte: start, lte: end } },
            _sum: { brutto: true },
          })
          .then((agg) => ({
            month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            revenue: Number(agg._sum.brutto ?? 0),
          }));
      }),
    );
    return results;
  }
}
