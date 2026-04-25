import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, Objekte, TaskType } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  AktivitaetenQueryDto,
  CreateObjektDto,
  UpdateObjektDto,
} from './dto/objekte.dto';

type ObjektResponse = {
  id: number;
  name: string;
  strasse: string | null;
  hausnummer: string | null;
  plz: string | null;
  ort: string | null;
  notiz: string | null;
  status: string;
  filter_typen: string | null;
  vorlage_id: number | null;
  kunden_id: number | null;
  kunden_name: string | null;
  created_at: Date | null;
};

type AktivitaetItem = {
  id: number;
  type: TaskType;
  title: string;
  zeitpunkt: Date;
  userId: number | null;
  userEmail: string | null;
  employeeId: number | null;
  employeeName: string | null;
  comment: string | null;
  photoUrl: string | null;
  durationMinutes: number | null;
  createdAt: Date;
};

@Injectable()
export class ObjekteService {
  private readonly logger = new Logger(ObjekteService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    pagination: PaginationDto,
    q?: string,
    customerId?: number,
  ): Promise<PaginatedResponse<ObjektResponse>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const whereParts: Prisma.ObjekteWhereInput[] = [];
    const trimmedQuery = q?.trim();
    if (trimmedQuery) {
      whereParts.push({
        OR: [
          { name: { contains: trimmedQuery, mode: 'insensitive' } },
          { ort: { contains: trimmedQuery, mode: 'insensitive' } },
          { strasse: { contains: trimmedQuery, mode: 'insensitive' } },
        ],
      });
    }
    if (typeof customerId === 'number') {
      whereParts.push({ kunden_id: BigInt(customerId) });
    }
    const where = whereParts.length > 0 ? { AND: whereParts } : undefined;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.objekte.findMany({
        where,
        include: { kunden: { select: { name: true } } },
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.objekte.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.mapObjekt(r)),
      total,
      page,
      pageSize,
    };
  }

  async findAllUnpaginated(customerId?: number): Promise<ObjektResponse[]> {
    const rows = await this.prisma.objekte.findMany({
      where:
        typeof customerId === 'number'
          ? { kunden_id: BigInt(customerId) }
          : undefined,
      include: { kunden: { select: { name: true } } },
      orderBy: { name: 'asc' },
      take: 5000,
    });
    return rows.map((r) => this.mapObjekt(r));
  }

  async create(dto: CreateObjektDto): Promise<ObjektResponse> {
    const created = await this.prisma.objekte.create({
      data: {
        name: dto.name,
        strasse: dto.street ?? null,
        hausnummer: dto.houseNumber ?? null,
        plz: dto.postalCode ?? null,
        ort: dto.city ?? null,
        notiz: dto.note ?? null,
        status: dto.status ?? 'AKTIV',
        filter_typen: dto.filterTypes ?? '',
        vorlage_id: dto.templateId ? BigInt(dto.templateId) : null,
        kunden: { connect: { id: BigInt(dto.customerId) } },
      },
      include: { kunden: { select: { name: true } } },
    });
    return this.mapObjekt(created);
  }

  async update(id: number, dto: UpdateObjektDto): Promise<ObjektResponse> {
    const existing = await this.prisma.objekte.findUnique({
      where: { id: BigInt(id) },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException();

    const updated = await this.prisma.objekte.update({
      where: { id: BigInt(id) },
      data: {
        name: dto.name,
        strasse: dto.street ?? null,
        hausnummer: dto.houseNumber ?? null,
        plz: dto.postalCode ?? null,
        ort: dto.city ?? null,
        notiz: dto.note ?? null,
        status: dto.status ?? 'AKTIV',
        filter_typen: dto.filterTypes ?? '',
        vorlage_id: dto.templateId ? BigInt(dto.templateId) : null,
        kunden: { connect: { id: BigInt(dto.customerId) } },
      },
      include: { kunden: { select: { name: true } } },
    });
    return this.mapObjekt(updated);
  }

  async remove(id: number): Promise<{ ok: true }> {
    const existing = await this.prisma.objekte.findUnique({
      where: { id: BigInt(id) },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException();

    await this.prisma.objekte.update({
      where: { id: BigInt(id) },
      data: { status: 'INAKTIV' },
    });
    return { ok: true };
  }

  async getAktivitaeten(
    objektId: number,
    query: AktivitaetenQueryDto,
  ): Promise<PaginatedResponse<AktivitaetItem>> {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;

    const whereParts: Prisma.TasksWhereInput[] = [
      { object_id: BigInt(objektId) },
    ];

    if (query.type) {
      const types = query.type
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean) as TaskType[];
      if (types.length > 0) {
        whereParts.push({ type: { in: types } });
      }
    }

    if (typeof query.userId === 'number') {
      whereParts.push({ user_id: BigInt(query.userId) });
    }

    if (typeof query.employeeId === 'number') {
      whereParts.push({ employee_id: BigInt(query.employeeId) });
    }

    const createdFrom = query.createdFrom ? new Date(query.createdFrom) : null;
    const createdTo = query.createdTo ? new Date(query.createdTo) : null;
    if (createdFrom || createdTo) {
      whereParts.push({
        created_at: {
          gte: createdFrom ?? undefined,
          lte: createdTo ?? undefined,
        },
      });
    }

    const where = whereParts.length > 0 ? { AND: whereParts } : undefined;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.tasks.findMany({
        where,
        include: {
          user: { select: { id: true, email: true } },
          employee: { select: { id: true, name: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.tasks.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: Number(r.id),
        type: r.type,
        title: r.title,
        zeitpunkt: r.completed_at ?? r.due_at ?? r.created_at,
        userId: r.user_id ? Number(r.user_id) : null,
        userEmail: r.user?.email ?? null,
        employeeId: r.employee_id ? Number(r.employee_id) : null,
        employeeName: r.employee?.name ?? null,
        comment: r.comment ?? null,
        photoUrl: r.photo_url ?? null,
        durationMinutes: r.duration_minutes ?? null,
        createdAt: r.created_at,
      })),
      total,
      page,
      pageSize,
    };
  }

  private mapObjekt(
    row: Objekte & { kunden?: { name: string } | null },
  ): ObjektResponse {
    return {
      id: Number(row.id),
      name: row.name,
      strasse: row.strasse ?? null,
      hausnummer: row.hausnummer ?? null,
      plz: row.plz ?? null,
      ort: row.ort ?? null,
      notiz: row.notiz ?? null,
      status: row.status,
      filter_typen: row.filter_typen ?? null,
      vorlage_id: row.vorlage_id ? Number(row.vorlage_id) : null,
      kunden_id: row.kunden_id ? Number(row.kunden_id) : null,
      kunden_name: row.kunden?.name ?? null,
      created_at: row.created_at ?? null,
    };
  }
}
