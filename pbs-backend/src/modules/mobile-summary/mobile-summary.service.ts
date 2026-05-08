import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AccessPolicyService } from '../access-policy/access-policy.service';
import type { AccessPolicyAuth } from '../access-policy/access-policy.service';

type DashboardSummaryParams = {
  auth: AccessPolicyAuth;
  objectId: number | null;
  pickupLimit: number;
};

type StampRow = {
  id: bigint;
  mitarbeiter_id: bigint;
  objekt_id: bigint | null;
  start: Date;
  stop: Date | null;
  dauer_minuten: number | null;
  notiz: string | null;
};

type PickupRow = {
  id: bigint;
  objekt_id: bigint;
  muellart: string;
  farbe: string;
  abholung: Date;
  erledigt: boolean;
  objekte: { name: string };
};

@Injectable()
export class MobileSummaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: AccessPolicyService,
  ) {}

  async dashboardSummary(params: DashboardSummaryParams) {
    if (params.objectId != null) {
      await this.accessPolicy.assertCanAccessObject(
        params.auth,
        params.objectId,
      );
    }
    const employeeId = this.resolveEmployeeId(params.auth);
    const today = this.startOfToday();
    const tomorrow = this.addDays(today, 1);
    const accessibleObjectIds = await this.accessPolicy.accessibleObjectIds(
      params.auth,
    );
    const objectIdFilter =
      params.objectId != null ? [BigInt(params.objectId)] : accessibleObjectIds;

    const pickupWhere = {
      erledigt: false,
      aktiv: true,
      ...(objectIdFilter ? { objekt_id: { in: objectIdFilter } } : {}),
    };

    const [activeStamp, todayEntries, pickups, duePickupCount] =
      await Promise.all([
        employeeId == null
          ? Promise.resolve<StampRow | null>(null)
          : this.prisma.stempel.findFirst({
              where: { mitarbeiter_id: BigInt(employeeId), stop: null },
              orderBy: { start: 'desc' },
            }),
        employeeId == null
          ? Promise.resolve<StampRow[]>([])
          : this.prisma.stempel.findMany({
              where: {
                mitarbeiter_id: BigInt(employeeId),
                start: { gte: today, lt: tomorrow },
              },
              orderBy: { start: 'desc' },
              take: 100,
            }),
        this.prisma.muellplan.findMany({
          where: pickupWhere,
          orderBy: { abholung: 'asc' },
          take: params.pickupLimit,
          include: { objekte: { select: { name: true } } },
        }),
        this.prisma.muellplan.count({
          where: { ...pickupWhere, abholung: { lte: today } },
        }),
      ]);

    const mappedPickups = pickups.map((pickup) =>
      this.mapPickup(pickup, today),
    );
    const activeStampCount = activeStamp == null ? 0 : 1;

    return {
      scope: params.objectId == null ? 'accessible-objects' : 'selected-object',
      objectId: params.objectId,
      today: this.toDateKey(today),
      openPointsCount: activeStampCount + duePickupCount,
      activeStamp: activeStamp ? this.mapStamp(activeStamp) : null,
      activeStampStatus: activeStamp ? 'active' : 'inactive',
      todayEntries: todayEntries.map((stamp) => this.mapStamp(stamp)),
      totalTrackedMinutes: todayEntries.reduce(
        (sum, stamp) => sum + (stamp.dauer_minuten ?? 0),
        0,
      ),
      upcomingPickups: mappedPickups,
    };
  }

  private resolveEmployeeId(auth: AccessPolicyAuth): number | null {
    if (auth.role === 'mitarbeiter') {
      this.accessPolicy.requireEmployeeMapping(auth);
      return auth.employeeId;
    }
    return auth.employeeId;
  }

  private mapStamp(row: StampRow) {
    return {
      id: Number(row.id),
      mitarbeiter_id: Number(row.mitarbeiter_id),
      objekt_id: row.objekt_id ? Number(row.objekt_id) : null,
      start: row.start.toISOString(),
      stop: row.stop ? row.stop.toISOString() : null,
      dauer_minuten: row.dauer_minuten,
      notiz: row.notiz,
    };
  }

  private mapPickup(row: PickupRow, today: Date) {
    const pickupDate = this.dateOnly(row.abholung);
    return {
      id: Number(row.id),
      objekt_id: Number(row.objekt_id),
      objekt_name: row.objekte.name,
      muellart: row.muellart,
      farbe: row.farbe,
      abholung: this.toDateKey(row.abholung),
      erledigt: row.erledigt,
      isToday: pickupDate.getTime() === today.getTime(),
      isDue: pickupDate.getTime() <= today.getTime(),
    };
  }

  private startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private dateOnly(value: Date): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private addDays(value: Date, days: number): Date {
    const date = new Date(value);
    date.setDate(date.getDate() + days);
    return date;
  }

  private toDateKey(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
