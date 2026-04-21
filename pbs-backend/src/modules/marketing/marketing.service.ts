import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  CreateMarketingKontaktDto,
  UpdateMarketingKontaktDto,
} from './dto/marketing.dto';

const VALID_STATUS = [
  'neu',
  'gesendet',
  'interesse',
  'kein-interesse',
  'angebot',
];

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async alleKontakteLaden(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.marketing.findMany({
        orderBy: [{ datum: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.marketing.count(),
    ]);
    return {
      data: rows.map((r) => ({ ...r, id: Number(r.id) })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async kontaktErstellen(d: CreateMarketingKontaktDto) {
    const r = await this.prisma.marketing.create({
      data: {
        name: d.name,
        person: d.person ?? null,
        email: d.email,
        tel: d.tel ?? null,
        strasse: d.strasse ?? null,
        ort: d.ort ?? null,
        notiz: d.notiz ?? null,
        status: d.status && VALID_STATUS.includes(d.status) ? d.status : 'neu',
        status_notiz: d.status_notiz ?? null,
        datum: d.datum ? new Date(d.datum) : new Date(),
      },
    });
    return { ...r, id: Number(r.id) };
  }

  async kontaktAktualisieren(id: number, d: UpdateMarketingKontaktDto) {
    if (
      !(await this.prisma.marketing.findUnique({ where: { id: BigInt(id) } }))
    )
      throw new NotFoundException();
    const r = await this.prisma.marketing.update({
      where: { id: BigInt(id) },
      data: {
        name: d.name,
        person: d.person ?? null,
        email: d.email,
        tel: d.tel ?? null,
        strasse: d.strasse ?? null,
        ort: d.ort ?? null,
        notiz: d.notiz ?? null,
        status: d.status && VALID_STATUS.includes(d.status) ? d.status : 'neu',
        status_notiz: d.status_notiz ?? null,
      },
    });
    return { ...r, id: Number(r.id) };
  }

  async kontaktLoeschen(id: number) {
    if (
      !(await this.prisma.marketing.findUnique({ where: { id: BigInt(id) } }))
    )
      throw new NotFoundException();
    await this.prisma.marketing.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }
}
