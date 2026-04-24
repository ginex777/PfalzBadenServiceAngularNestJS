import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { EvidenceListQueryDto, UploadEvidenceDto } from './dto/nachweise.dto';

export interface EvidenceListItem {
  id: number;
  objekt_id: number;
  mitarbeiter_id: number | null;
  filename: string;
  mimetype: string;
  filesize: number;
  sha256: string;
  notiz: string | null;
  erstellt_am: Date;
  erstellt_von: string;
  erstellt_von_name: string | null;
}

@Injectable()
export class NachweiseService {
  private readonly logger = new Logger(NachweiseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: EvidenceListQueryDto,
  ): Promise<PaginatedResponse<EvidenceListItem>> {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;

    const where = query.objectId
      ? { objekt_id: BigInt(query.objectId) }
      : undefined;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.nachweise.findMany({
        where,
        orderBy: { erstellt_am: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          objekt_id: true,
          mitarbeiter_id: true,
          filename: true,
          mimetype: true,
          filesize: true,
          sha256: true,
          notiz: true,
          erstellt_am: true,
          erstellt_von: true,
          erstellt_von_name: true,
        },
      }),
      this.prisma.nachweise.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: Number(r.id),
        objekt_id: Number(r.objekt_id),
        mitarbeiter_id: r.mitarbeiter_id ? Number(r.mitarbeiter_id) : null,
        filename: r.filename,
        mimetype: r.mimetype,
        filesize: r.filesize,
        sha256: r.sha256,
        notiz: r.notiz,
        erstellt_am: r.erstellt_am,
        erstellt_von: r.erstellt_von,
        erstellt_von_name: r.erstellt_von_name,
      })),
      total,
      page,
      pageSize,
    };
  }

  async get(id: number) {
    const row = await this.prisma.nachweise.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        objekt_id: true,
        mitarbeiter_id: true,
        filename: true,
        mimetype: true,
        filesize: true,
        sha256: true,
        notiz: true,
        erstellt_am: true,
        erstellt_von: true,
        erstellt_von_name: true,
      },
    });
    if (!row) throw new NotFoundException();
    return {
      ...row,
      id: Number(row.id),
      objekt_id: Number(row.objekt_id),
      mitarbeiter_id: row.mitarbeiter_id ? Number(row.mitarbeiter_id) : null,
    };
  }

  async download(id: number) {
    const row = await this.prisma.nachweise.findUnique({
      where: { id: BigInt(id) },
      select: {
        filename: true,
        mimetype: true,
        data: true,
      },
    });
    if (!row) throw new NotFoundException();
    return row;
  }

  async upload(params: {
    file: Express.Multer.File;
    dto: UploadEvidenceDto;
    createdBy: { email: string; fullName: string };
    employeeId?: number | null;
  }) {
    const { file, dto, createdBy, employeeId } = params;

    if (!file) {
      throw new BadRequestException({
        code: 'MISSING_FILE',
        message: 'Foto ist erforderlich.',
      });
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException({
        code: 'INVALID_MIMETYPE',
        message: 'Nur Bilddateien sind erlaubt.',
      });
    }

    const objectRow = await this.prisma.objekte.findUnique({
      where: { id: BigInt(dto.objectId) },
      select: { id: true, name: true },
    });
    if (!objectRow) {
      throw new BadRequestException({
        code: 'INVALID_OBJECT',
        message: 'Objekt existiert nicht. Bitte ein gültiges Objekt auswählen.',
      });
    }

    const sha256 = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');
    const duplicate = await this.prisma.nachweise.findUnique({
      where: { sha256 },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException({
        code: 'DUPLICATE_FILE',
        message: 'Dieses Foto wurde bereits hochgeladen.',
      });
    }

    const row = await this.prisma.nachweise.create({
      data: {
        objekte: { connect: { id: BigInt(dto.objectId) } },
        mitarbeiter: employeeId ? { connect: { id: BigInt(employeeId) } } : undefined,
        filename: file.originalname,
        mimetype: file.mimetype,
        filesize: file.size,
        data: Uint8Array.from(file.buffer),
        sha256,
        notiz: dto.note ?? null,
        erstellt_von: createdBy.email,
        erstellt_von_name: createdBy.fullName || createdBy.email,
      },
    });

    this.logger.log(
      `Evidence uploaded: nachweis=${row.id.toString()} object=${dto.objectId} size=${file.size}`,
    );

    // Webapp notification: mobile field actions should surface quickly.
    await this.prisma.benachrichtigungen.create({
      data: {
        typ: 'MOBILE_EVIDENCE',
        titel: `Neuer Nachweis: ${objectRow.name}`,
        nachricht: row.notiz ?? undefined,
        link: `/nachweise`,
        gelesen: false,
      },
    });

    return {
      id: Number(row.id),
      objekt_id: Number(row.objekt_id),
      mitarbeiter_id: row.mitarbeiter_id ? Number(row.mitarbeiter_id) : null,
      filename: row.filename,
      mimetype: row.mimetype,
      filesize: row.filesize,
      sha256: row.sha256,
      notiz: row.notiz,
      erstellt_am: row.erstellt_am,
      erstellt_von: row.erstellt_von,
      erstellt_von_name: row.erstellt_von_name,
    } satisfies EvidenceListItem;
  }
}
