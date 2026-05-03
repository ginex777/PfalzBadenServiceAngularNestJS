import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../core/database/prisma.service';
import type {
  ListStempeluhrQueryDto,
  StempelEintragDto,
  StempeluhrListResponseDto,
} from './dto/stempeluhr.dto';
import type { AccessPolicyService } from '../access-policy/access-policy.service';
import type { AccessPolicyAuth } from '../access-policy/access-policy.service';

@Injectable()
export class StempeluhrService {
  constructor(
    private prisma: PrismaService,
    private readonly accessPolicy: AccessPolicyService,
  ) {}

  async list(
    dto: ListStempeluhrQueryDto,
    auth: AccessPolicyAuth,
  ): Promise<StempeluhrListResponseDto> {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 50;
    const skip = (page - 1) * pageSize;

    if (dto.objektId) {
      await this.accessPolicy.assertCanAccessObject(auth, dto.objektId);
    }

    const where = {
      ...(dto.mitarbeiterId && { mitarbeiter_id: BigInt(dto.mitarbeiterId) }),
      ...(dto.objektId && { objekt_id: BigInt(dto.objektId) }),
      ...(dto.kundenId && { objekte: { kunden_id: BigInt(dto.kundenId) } }),
      ...(dto.von &&
        dto.bis && {
          start: {
            gte: new Date(dto.von),
            lte: new Date(dto.bis),
          },
        }),
      stop: { not: null },
    };

    const [total, entries, aggregation] = await Promise.all([
      this.prisma.stempel.count({ where }),
      this.prisma.stempel.findMany({
        where,
        include: {
          mitarbeiter: true,
          objekte: {
            include: {
              kunden: true,
            },
          },
        },
        orderBy: { start: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.stempel.aggregate({
        where,
        _sum: {
          dauer_minuten: true,
        },
      }),
    ]);

    const data: StempelEintragDto[] = entries.map((entry) => ({
      id: Number(entry.id),
      mitarbeiterId: Number(entry.mitarbeiter_id),
      mitarbeiterName: entry.mitarbeiter.name,
      objektId: entry.objekt_id ? Number(entry.objekt_id) : null,
      objektName: entry.objekte?.name ?? null,
      kundeId: entry.objekte?.kunden_id
        ? Number(entry.objekte.kunden_id)
        : null,
      kundeName: entry.objekte?.kunden?.name ?? null,
      start: entry.start.toISOString(),
      stop: entry.stop ? entry.stop.toISOString() : null,
      dauerMinuten: entry.dauer_minuten,
      notiz: entry.notiz,
    }));

    const totalDurationMinutes = aggregation._sum.dauer_minuten || 0;

    return {
      data,
      total,
      totalDurationMinutes,
    };
  }
}
