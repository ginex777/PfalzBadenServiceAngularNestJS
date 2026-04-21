import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';
import { Prisma, Angebote } from '@prisma/client';
import { CreateAngebotDto, UpdateAngebotDto } from './dto/angebot.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@Injectable()
export class AngeboteService {
  private readonly logger = new Logger(AngeboteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<ReturnType<AngeboteService['mapAngebot']>>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.angebote.findMany({
        orderBy: [{ datum: 'desc' }, { id: 'desc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.angebote.count(),
    ]);
    return {
      data: rows.map((r) => this.mapAngebot(r)),
      total,
      page,
      pageSize,
    };
  }

  async create(daten: CreateAngebotDto, nutzer?: string) {
    const angebot = await this.prisma.angebote.create({
      data: this.mapData(daten),
    });
    await this.audit.log(
      'angebote',
      angebot.id,
      'CREATE',
      null,
      angebot,
      nutzer,
    );
    return this.mapAngebot(angebot);
  }

  async update(id: number, daten: UpdateAngebotDto, nutzer?: string) {
    const alt = await this.prisma.angebote.findUnique({
      where: { id: BigInt(id) },
    });
    if (!alt) throw new NotFoundException(`Angebot ${id} nicht gefunden`);
    const neu = await this.prisma.angebote.update({
      where: { id: BigInt(id) },
      data: this.mapData(daten),
    });
    await this.audit.log('angebote', BigInt(id), 'UPDATE', alt, neu, nutzer);
    return this.mapAngebot(neu);
  }

  async delete(id: number, nutzer?: string) {
    const alt = await this.prisma.angebote.findUnique({
      where: { id: BigInt(id) },
    });
    if (!alt) throw new NotFoundException(`Angebot ${id} nicht gefunden`);
    await this.prisma.angebote.delete({ where: { id: BigInt(id) } });
    await this.audit.log('angebote', BigInt(id), 'DELETE', alt, null, nutzer);
    return { ok: true };
  }

  private mapData(d: CreateAngebotDto): Prisma.AngeboteCreateInput {
    return {
      nr: d.nr,
      empf: d.empf,
      str: d.str ?? null,
      ort: d.ort ?? null,
      titel: d.titel ?? null,
      datum: d.datum ? new Date(d.datum) : null,
      brutto: new Prisma.Decimal(d.brutto),
      gueltig_bis: d.gueltig_bis ? new Date(d.gueltig_bis) : null,
      angenommen: d.angenommen ?? false,
      abgelehnt: d.abgelehnt ?? false,
      gesendet: d.gesendet ?? false,
      zusatz: d.zusatz ?? null,
      positionen:
        (d.positionen as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      kunden: d.kunden_id
        ? { connect: { id: BigInt(d.kunden_id) } }
        : undefined,
    };
  }

  private mapAngebot(r: Angebote) {
    return {
      ...r,
      id: Number(r.id),
      kunden_id: r.kunden_id ? Number(r.kunden_id) : null,
      brutto: Number(r.brutto),
      angenommen: Boolean(r.angenommen),
      abgelehnt: Boolean(r.abgelehnt),
      gesendet: Boolean(r.gesendet),
    };
  }
}
