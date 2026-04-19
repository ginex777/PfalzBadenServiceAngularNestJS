import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';
import { CreateKundeDto, UpdateKundeDto } from './dto/kunde.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@Injectable()
export class KundenService {
  private readonly logger = new Logger(KundenService.name);

  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async findAll(pagination: PaginationDto): Promise<PaginatedResponse<Record<string, unknown>>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.kunden.findMany({ orderBy: { name: 'asc' }, skip, take: limit }),
      this.prisma.kunden.count(),
    ]);
    return {
      data: rows.map(r => ({ ...r, id: Number(r.id) })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
    await this.audit.protokollieren('kunden', kunde.id, 'CREATE', null, kunde, nutzer);
    return { ...kunde, id: Number(kunde.id) };
  }

  async kundeAktualisieren(id: number, daten: UpdateKundeDto, nutzer?: string) {
    const alt = await this.prisma.kunden.findUnique({ where: { id: BigInt(id) } });
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
    await this.audit.protokollieren('kunden', BigInt(id), 'UPDATE', alt, neu, nutzer);
    return { ...neu, id: Number(neu.id) };
  }

  async kundeLoeschen(id: number, nutzer?: string) {
    const alt = await this.prisma.kunden.findUnique({ where: { id: BigInt(id) } });
    if (!alt) throw new NotFoundException(`Kunde ${id} nicht gefunden`);
    const reCount = await this.prisma.rechnungen.count({ where: { kunden_id: BigInt(id) } });
    const angCount = await this.prisma.angebote.count({ where: { kunden_id: BigInt(id) } });
    if (reCount + angCount > 0) {
      throw new ConflictException(`Kunde kann nicht gelöscht werden: ${reCount} Rechnung(en) und ${angCount} Angebot(e) verknüpft.`);
    }
    await this.prisma.kunden.delete({ where: { id: BigInt(id) } });
    await this.audit.protokollieren('kunden', BigInt(id), 'DELETE', alt, null, nutzer);
    return { ok: true };
  }
}
