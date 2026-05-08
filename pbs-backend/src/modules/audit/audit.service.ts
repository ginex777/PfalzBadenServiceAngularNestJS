import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import type { AuditListQueryDto } from './dto/audit-list-query.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(
    table: string,
    recordId: bigint | number,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValue?: unknown,
    newValue?: unknown,
    user?: string,
    userName?: string,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tabelle: table,
        datensatz_id: BigInt(recordId),
        aktion: action,
        alt_wert: oldValue ? (oldValue as object) : undefined,
        neu_wert: newValue ? (newValue as object) : undefined,
        nutzer: user ?? null,
        nutzer_name: userName ?? null,
      },
    });
  }

  async listTables(): Promise<string[]> {
    const rows = await this.prisma.auditLog.findMany({
      distinct: ['tabelle'],
      select: { tabelle: true },
      orderBy: { tabelle: 'asc' },
      take: 1000,
    });
    return rows.map((row) => row.tabelle);
  }

  async findAll(query: AuditListQueryDto) {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;
    const q = query.q?.trim();
    const aktion = query.aktion?.trim();
    const tabelle = query.tabelle?.trim();
    const where =
      q || aktion || tabelle
        ? {
            AND: [
              aktion ? { aktion } : {},
              tabelle ? { tabelle } : {},
              q
                ? {
                    OR: [
                      {
                        tabelle: { contains: q, mode: 'insensitive' as const },
                      },
                      { nutzer: { contains: q, mode: 'insensitive' as const } },
                      {
                        nutzer_name: {
                          contains: q,
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
      this.prisma.auditLog.findMany({
        where,
        orderBy: { zeitstempel: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      data: rows.map((row) => ({
        ...row,
        id: Number(row.id),
        datensatz_id: Number(row.datensatz_id),
      })),
      total,
      page,
      pageSize,
    };
  }

  async findByTable(tabelle: string, query: AuditListQueryDto) {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;
    const q = query.q?.trim();
    const aktion = query.aktion?.trim();
    const where =
      q || aktion
        ? {
            AND: [
              { tabelle },
              aktion ? { aktion } : {},
              q
                ? {
                    OR: [
                      { nutzer: { contains: q, mode: 'insensitive' as const } },
                      {
                        nutzer_name: {
                          contains: q,
                          mode: 'insensitive' as const,
                        },
                      },
                    ],
                  }
                : {},
            ],
          }
        : { tabelle };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { zeitstempel: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      data: rows.map((row) => ({
        ...row,
        id: Number(row.id),
        datensatz_id: Number(row.datensatz_id),
      })),
      total,
      page,
      pageSize,
    };
  }

  async findByRecord(tabelle: string, id: number) {
    const rows = await this.prisma.auditLog.findMany({
      where: { tabelle, datensatz_id: BigInt(id) },
      orderBy: { zeitstempel: 'desc' },
      take: 200,
    });
    return rows.map((row) => ({
      ...row,
      id: Number(row.id),
      datensatz_id: Number(row.datensatz_id),
    }));
  }
}
