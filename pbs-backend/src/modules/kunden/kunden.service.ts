import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import type { PrismaService } from '../../core/database/prisma.service';
import type { AuditService } from '../../modules/audit/audit.service';
import type { CreateKundeDto, UpdateKundeDto } from './dto/kunde.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import type { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@Injectable()
export class KundenService {
  private readonly logger = new Logger(KundenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(
    pagination: PaginationDto,
    q?: string,
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const query = q?.trim();
    const where =
      query && query.length > 0
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' as const } },
              { ort: { contains: query, mode: 'insensitive' as const } },
              { email: { contains: query, mode: 'insensitive' as const } },
            ],
          }
        : undefined;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.kunden.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.kunden.count({ where }),
    ]);
    return {
      data: rows.map((r) => ({ ...r, id: Number(r.id) })),
      total,
      page,
      pageSize,
    };
  }

  async create(daten: CreateKundeDto, user?: string) {
    const kunde = await this.prisma.kunden.create({
      data: {
        name: daten.name,
        strasse: daten.strasse ?? null,
        ort: daten.ort ?? null,
        tel: daten.tel ?? null,
        email: daten.email ?? null,
        notiz: daten.notiz ?? null,
      },
    });
    await this.audit.log('kunden', kunde.id, 'CREATE', null, kunde, user);
    return { ...kunde, id: Number(kunde.id) };
  }

  async update(id: number, daten: UpdateKundeDto, user?: string) {
    const alt = await this.prisma.kunden.findUnique({
      where: { id: BigInt(id) },
    });
    if (!alt) throw new NotFoundException(`Kunde ${id} nicht gefunden`);
    const neu = await this.prisma.kunden.update({
      where: { id: BigInt(id) },
      data: {
        name: daten.name,
        strasse: daten.strasse ?? null,
        ort: daten.ort ?? null,
        tel: daten.tel ?? null,
        email: daten.email ?? null,
        notiz: daten.notiz ?? null,
      },
    });
    await this.audit.log('kunden', BigInt(id), 'UPDATE', alt, neu, user);
    return { ...neu, id: Number(neu.id) };
  }

  async delete(id: number, user?: string) {
    const alt = await this.prisma.kunden.findUnique({
      where: { id: BigInt(id) },
    });
    if (!alt) throw new NotFoundException(`Kunde ${id} nicht gefunden`);
    const reCount = await this.prisma.rechnungen.count({
      where: { kunden_id: BigInt(id) },
    });
    const angCount = await this.prisma.angebote.count({
      where: { kunden_id: BigInt(id) },
    });
    if (reCount + angCount > 0) {
      throw new ConflictException(
        `Kunde kann nicht gelöscht werden: ${reCount} Rechnung(en) und ${angCount} Angebot(e) verknüpft.`,
      );
    }
    await this.prisma.kunden.delete({ where: { id: BigInt(id) } });
    await this.audit.log('kunden', BigInt(id), 'DELETE', alt, null, user);
    return { ok: true };
  }
}
