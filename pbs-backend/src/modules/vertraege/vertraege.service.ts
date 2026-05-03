import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Vertraege } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../core/database/prisma.service';
import type { AuditService } from '../audit/audit.service';
import type { CreateVertragDto, UpdateVertragDto } from './dto/vertrag.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import type { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@Injectable()
export class VertraegeService {
  private readonly logger = new Logger(VertraegeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(
    pagination: PaginationDto,
    kundenId?: number,
    q?: string,
  ): Promise<PaginatedResponse<ReturnType<VertraegeService['_map']>>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const query = q?.trim();
    const where =
      kundenId || query
        ? {
            AND: [
              kundenId ? { kunden_id: BigInt(kundenId) } : {},
              query
                ? {
                    OR: [
                      {
                        kunden_name: {
                          contains: query,
                          mode: 'insensitive' as const,
                        },
                      },
                      {
                        titel: {
                          contains: query,
                          mode: 'insensitive' as const,
                        },
                      },
                      {
                        vorlage: {
                          contains: query,
                          mode: 'insensitive' as const,
                        },
                      },
                    ],
                  }
                : {},
            ],
          }
        : undefined;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.vertraege.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.vertraege.count({ where }),
    ]);
    return {
      data: rows.map((v) => this._map(v)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const v = await this.prisma.vertraege.findUnique({
      where: { id: BigInt(id) },
    });
    if (!v) throw new NotFoundException(`Vertrag ${id} nicht gefunden`);
    return this._map(v);
  }

  async create(d: CreateVertragDto, nutzer?: string) {
    const v = await this.prisma.vertraege.create({
      data: {
        kunden_id: d.kunden_id ? BigInt(d.kunden_id) : null,
        kunden_name: d.kunden_name,
        kunden_strasse: d.kunden_strasse ?? null,
        kunden_ort: d.kunden_ort ?? null,
        vorlage: d.vorlage ?? 'Dienstleistungsvertrag',
        titel: d.titel,
        vertragsbeginn: new Date(d.vertragsbeginn),
        laufzeit_monate: d.laufzeit_monate ?? 12,
        monatliche_rate: new Prisma.Decimal(d.monatliche_rate),
        leistungsumfang: d.leistungsumfang ?? null,
        kuendigungsfrist: d.kuendigungsfrist ?? 3,
        status: 'aktiv',
      },
    });
    await this.audit.log(
      'vertraege',
      v.id,
      'CREATE',
      null,
      this._map(v),
      nutzer,
    );
    return this._map(v);
  }

  async update(id: number, d: UpdateVertragDto, nutzer?: string) {
    const alt = await this.prisma.vertraege.findUnique({
      where: { id: BigInt(id) },
    });
    if (!alt) throw new NotFoundException();
    const v = await this.prisma.vertraege.update({
      where: { id: BigInt(id) },
      data: {
        kunden_name: d.kunden_name,
        kunden_strasse:
          d.kunden_strasse !== undefined
            ? (d.kunden_strasse ?? null)
            : undefined,
        kunden_ort:
          d.kunden_ort !== undefined ? (d.kunden_ort ?? null) : undefined,
        vorlage: d.vorlage,
        titel: d.titel,
        vertragsbeginn: d.vertragsbeginn
          ? new Date(d.vertragsbeginn)
          : undefined,
        laufzeit_monate: d.laufzeit_monate,
        monatliche_rate:
          d.monatliche_rate !== undefined
            ? new Prisma.Decimal(d.monatliche_rate)
            : undefined,
        leistungsumfang:
          d.leistungsumfang !== undefined
            ? (d.leistungsumfang ?? null)
            : undefined,
        kuendigungsfrist: d.kuendigungsfrist,
        status: d.status,
        pdf_filename:
          d.pdf_filename !== undefined ? (d.pdf_filename ?? null) : undefined,
        html_body:
          d.html_body !== undefined ? (d.html_body ?? null) : undefined,
      },
    });
    await this.audit.log(
      'vertraege',
      v.id,
      'UPDATE',
      this._map(alt),
      this._map(v),
      nutzer,
    );
    return this._map(v);
  }

  async delete(id: number, nutzer?: string) {
    const v = await this.prisma.vertraege.findUnique({
      where: { id: BigInt(id) },
    });
    if (!v) throw new NotFoundException();
    await this.prisma.vertraege.delete({ where: { id: BigInt(id) } });
    await this.audit.log(
      'vertraege',
      v.id,
      'DELETE',
      this._map(v),
      null,
      nutzer,
    );
    return { ok: true };
  }

  private _map(v: Vertraege) {
    const monatlicheRate = Number(v.monatliche_rate);
    const gesamtwert = monatlicheRate * v.laufzeit_monate; // ADDED: Total contract value calculation

    return {
      ...v,
      id: Number(v.id),
      kunden_id: v.kunden_id ? Number(v.kunden_id) : null,
      monatliche_rate: monatlicheRate,
      gesamtwert, // ADDED: Include total contract value
      html_body: undefined, // never send html_body over API
    };
  }
}
