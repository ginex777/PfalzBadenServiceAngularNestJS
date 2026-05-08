import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import type { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import type {
  EvidenceListQueryDto,
  UploadEvidenceDto,
} from './dto/nachweise.dto';
import { AccessPolicyService } from '../access-policy/access-policy.service';
import type { AccessPolicyAuth } from '../access-policy/access-policy.service';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: AccessPolicyService,
  ) {}

  async list(
    query: EvidenceListQueryDto,
    auth: AccessPolicyAuth,
  ): Promise<PaginatedResponse<EvidenceListItem>> {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;

    const accessibleObjectIds =
      await this.accessPolicy.accessibleObjectIds(auth);
    const where: Prisma.NachweiseWhereInput = {};
    if (query.objectId) where.objekt_id = BigInt(query.objectId);
    if (accessibleObjectIds) {
      this.accessPolicy.requireEmployeeMapping(auth);
      where.OR = [
        { objekt_id: { in: accessibleObjectIds } },
        { mitarbeiter_id: BigInt(auth.employeeId) },
      ];
    }

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

  async get(id: number, auth: AccessPolicyAuth) {
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
    await this.assertCanAccessEvidenceRow(auth, {
      objectId: Number(row.objekt_id),
      employeeId: row.mitarbeiter_id ? Number(row.mitarbeiter_id) : null,
    });
    return {
      ...row,
      id: Number(row.id),
      objekt_id: Number(row.objekt_id),
      mitarbeiter_id: row.mitarbeiter_id ? Number(row.mitarbeiter_id) : null,
    };
  }

  async download(id: number, auth: AccessPolicyAuth) {
    const row = await this.prisma.nachweise.findUnique({
      where: { id: BigInt(id) },
      select: {
        objekt_id: true,
        mitarbeiter_id: true,
        filename: true,
        mimetype: true,
        data: true,
      },
    });
    if (!row) throw new NotFoundException();
    await this.assertCanAccessEvidenceRow(auth, {
      objectId: Number(row.objekt_id),
      employeeId: row.mitarbeiter_id ? Number(row.mitarbeiter_id) : null,
    });
    return row;
  }

  async upload(params: {
    file: Express.Multer.File;
    dto: UploadEvidenceDto;
    createdBy: { email: string; fullName: string };
    employeeId?: number | null;
    auth: AccessPolicyAuth;
  }) {
    const { file, dto, createdBy, employeeId, auth } = params;

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
    if (!this.hasSupportedImageSignature(file.buffer)) {
      throw new BadRequestException({
        code: 'INVALID_FILE_SIGNATURE',
        message: 'Die Datei ist kein unterstÃ¼tztes Bildformat.',
      });
    }

    const objectRow = await this.prisma.objekte.findUnique({
      where: { id: BigInt(dto.objectId) },
      select: { id: true, name: true },
    });
    if (!objectRow) {
      throw new BadRequestException({
        code: 'INVALID_OBJECT',
        message:
          'Objekt existiert nicht. Bitte ein gÃ¼ltiges Objekt auswÃ¤hlen.',
      });
    }
    await this.accessPolicy.assertCanAccessObject(auth, dto.objectId);

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
        mitarbeiter: employeeId
          ? { connect: { id: BigInt(employeeId) } }
          : undefined,
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

  private async assertCanAccessEvidenceRow(
    auth: AccessPolicyAuth,
    row: { objectId: number; employeeId: number | null },
  ): Promise<void> {
    if (
      auth.role === 'mitarbeiter' &&
      auth.employeeId != null &&
      row.employeeId === auth.employeeId
    ) {
      return;
    }
    await this.accessPolicy.assertCanAccessObject(auth, row.objectId);
  }

  private hasSupportedImageSignature(buffer: Buffer): boolean {
    if (buffer.length < 4) return false;
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
    const isPng =
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;
    const isGif =
      buffer.length >= 6 &&
      buffer.subarray(0, 3).toString('ascii') === 'GIF' &&
      (buffer.subarray(3, 6).toString('ascii') === '87a' ||
        buffer.subarray(3, 6).toString('ascii') === '89a');
    const isWebp =
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    return isJpeg || isPng || isGif || isWebp;
  }
}
