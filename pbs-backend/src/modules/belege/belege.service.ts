import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import type { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { validateReceiptUpload } from '../../common/files/upload-file';
import * as crypto from 'crypto';

export interface BelegListItem {
  id: number;
  buchhaltung_id: number | null;
  filename: string;
  mimetype: string;
  filesize: number;
  sha256: string;
  typ: string | null;
  notiz: string | null;
  aufbewahrung_bis: string | undefined;
  erstellt_am: Date;
  buchung_name: string | null;
  buchung_brutto: number | null;
  buchung_kategorie: string | null;
}

@Injectable()
export class BelegeService {
  private readonly logger = new Logger(BelegeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async belegeLaden(
    pagination: PaginationDto,
    jahr?: number,
    filter?: { q?: string; typ?: string },
  ): Promise<PaginatedResponse<BelegListItem>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const query = filter?.q?.trim();
    const typ = filter?.typ?.trim();

    const where =
      jahr !== undefined || typ || query
        ? {
            AND: [
              jahr !== undefined
                ? {
                    erstellt_am: {
                      gte: new Date(jahr, 0, 1),
                      lt: new Date(jahr + 1, 0, 1),
                    },
                  }
                : {},
              typ ? { typ } : {},
              query
                ? {
                    OR: [
                      {
                        filename: {
                          contains: query,
                          mode: 'insensitive' as const,
                        },
                      },
                      {
                        notiz: {
                          contains: query,
                          mode: 'insensitive' as const,
                        },
                      },
                      {
                        buchhaltung: {
                          OR: [
                            {
                              name: {
                                contains: query,
                                mode: 'insensitive' as const,
                              },
                            },
                            {
                              kategorie: {
                                contains: query,
                                mode: 'insensitive' as const,
                              },
                            },
                          ],
                        },
                      },
                    ],
                  }
                : {},
            ],
          }
        : undefined;
    const include = {
      buchhaltung: { select: { name: true, brutto: true, kategorie: true } },
    } as const;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.belege.findMany({
        where,
        include,
        orderBy: { erstellt_am: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.belege.count({ where }),
    ]);
    return {
      data: rows.map((b) => ({
        id: Number(b.id),
        buchhaltung_id: b.buchhaltung_id ? Number(b.buchhaltung_id) : null,
        filename: b.filename,
        mimetype: b.mimetype,
        filesize: b.filesize,
        sha256: b.sha256,
        typ: b.typ,
        notiz: b.notiz,
        aufbewahrung_bis: b.aufbewahrung_bis?.toISOString().slice(0, 10),
        erstellt_am: b.erstellt_am,
        buchung_name: b.buchhaltung?.name ?? null,
        buchung_brutto:
          b.buchhaltung?.brutto != null ? Number(b.buchhaltung.brutto) : null,
        buchung_kategorie: b.buchhaltung?.kategorie ?? null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async belegLaden(id: number) {
    const b = await this.prisma.belege.findUnique({
      where: { id: BigInt(id) },
    });
    if (!b) throw new NotFoundException();
    const { data: _, ...rest } = b;
    return {
      ...rest,
      id: Number(b.id),
      buchhaltung_id: b.buchhaltung_id ? Number(b.buchhaltung_id) : null,
    };
  }

  async belegDownload(id: number) {
    const b = await this.prisma.belege.findUnique({
      where: { id: BigInt(id) },
    });
    if (!b) throw new NotFoundException();
    return b;
  }

  async belegeFuerBuchung(buchungId: number) {
    const rows = await this.prisma.belege.findMany({
      where: { buchhaltung_id: BigInt(buchungId) },
      orderBy: { erstellt_am: 'desc' },
      take: 1000,
    });
    return rows.map((b) => {
      const { data: _, ...rest } = b;
      return {
        ...rest,
        id: Number(b.id),
        buchhaltung_id: b.buchhaltung_id ? Number(b.buchhaltung_id) : null,
      };
    });
  }

  async belegHochladen(
    file: Express.Multer.File | undefined,
    buchhaltungId?: number,
    typ = 'beleg',
    notiz?: string,
  ) {
    const upload = validateReceiptUpload(file);
    const sha256 = crypto
      .createHash('sha256')
      .update(upload.data)
      .digest('hex');
    const vorhanden = await this.prisma.belege.findUnique({
      where: { sha256 },
    });
    if (vorhanden)
      throw new BadRequestException(
        'Dieser Beleg wurde bereits hochgeladen (GoBD: Duplikat)',
      );

    const aufbewahrungBis = new Date();
    aufbewahrungBis.setFullYear(aufbewahrungBis.getFullYear() + 10);

    const b = await this.prisma.belege.create({
      data: {
        buchhaltung_id: buchhaltungId ? BigInt(buchhaltungId) : null,
        filename: upload.filename,
        mimetype: upload.mimetype,
        filesize: upload.filesize,
        data: upload.data,
        sha256,
        typ,
        notiz: notiz ?? null,
        aufbewahrung_bis: aufbewahrungBis,
      },
    });

    if (buchhaltungId) {
      await this.prisma.buchhaltung.update({
        where: { id: BigInt(buchhaltungId) },
        data: { beleg_id: b.id },
      });
    }

    const { data: _, ...rest } = b;
    return {
      ...rest,
      id: Number(b.id),
      buchhaltung_id: b.buchhaltung_id ? Number(b.buchhaltung_id) : null,
    };
  }

  async notizAktualisieren(id: number, notiz: string) {
    if (!(await this.prisma.belege.findUnique({ where: { id: BigInt(id) } })))
      throw new NotFoundException();
    const b = await this.prisma.belege.update({
      where: { id: BigInt(id) },
      data: { notiz },
    });
    const { data: _, ...rest } = b;
    return { ...rest, id: Number(b.id) };
  }

  async belegLoeschen(id: number) {
    const b = await this.prisma.belege.findUnique({
      where: { id: BigInt(id) },
    });
    if (!b) throw new NotFoundException();
    if (b.aufbewahrung_bis && b.aufbewahrung_bis > new Date()) {
      throw new ForbiddenException(
        `GoBD Â§147 AO: Aufbewahrungsfrist lÃ¤uft bis ${b.aufbewahrung_bis.toISOString().slice(0, 10)}`,
      );
    }
    await this.prisma.belege.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }
}
