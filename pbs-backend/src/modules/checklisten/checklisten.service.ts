import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { TasksService } from '../tasks/tasks.service';
import type {
  ChecklistFieldDto,
  ChecklistFieldType,
  CreateChecklistSubmissionDto,
  CreateChecklistTemplateDto,
  UpdateChecklistTemplateDto,
} from './dto/checklisten.dto';
import type { ChecklistSubmissionListQueryDto } from './dto/checklisten.dto';

type AuthContext = {
  role: string;
  employeeId: number | null;
  user: { email: string; fullName: string };
};

type ChecklistAnswerValue = string | number | boolean | null;

export interface ChecklistTemplateListItem {
  id: number;
  name: string;
  description: string | null;
  version: number;
  isActive: boolean;
  fields: ChecklistFieldDto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistSubmissionListItem {
  id: number;
  submittedAt: Date;
  object: { id: number; name: string };
  template: { id: number; name: string; version: number };
  employee: { id: number; name: string } | null;
  createdByEmail: string;
  createdByName: string | null;
  note: string | null;
}

export interface ChecklistSubmissionDetail extends ChecklistSubmissionListItem {
  templateSnapshot: unknown;
  answers: unknown;
}

function toJsonField(field: ChecklistFieldDto): Prisma.InputJsonObject {
  return {
    fieldId: field.fieldId,
    label: field.label,
    type: field.type,
    helperText: field.helperText ?? null,
    required: field.required ?? null,
    options: field.options ?? null,
  };
}

function toJsonFields(fields: ChecklistFieldDto[]): Prisma.InputJsonArray {
  return fields.map((f) => toJsonField(f));
}

function toJsonAnswers(
  answers: { fieldId: string; value: ChecklistAnswerValue }[],
): Prisma.InputJsonArray {
  return answers.map((a) => ({
    fieldId: a.fieldId,
    value: a.value,
  }));
}

function parseJsonFields(raw: unknown): ChecklistFieldDto[] {
  if (!Array.isArray(raw)) return [];
  const result: ChecklistFieldDto[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null || Array.isArray(item))
      continue;
    const rec = item as Record<string, unknown>;
    const fieldId =
      typeof rec['fieldId'] === 'string' ? rec['fieldId'].trim() : '';
    const label = typeof rec['label'] === 'string' ? rec['label'].trim() : '';
    const type = rec['type'];
    if (!fieldId || !label) continue;
    if (
      type !== 'boolean' &&
      type !== 'text' &&
      type !== 'number' &&
      type !== 'select'
    )
      continue;

    const helperText =
      typeof rec['helperText'] === 'string' ? rec['helperText'] : undefined;
    const required =
      typeof rec['required'] === 'boolean' ? rec['required'] : undefined;
    const optionsRaw = rec['options'];
    const options =
      Array.isArray(optionsRaw) &&
      optionsRaw.every((o) => typeof o === 'string')
        ? (optionsRaw as string[])
        : undefined;

    result.push({
      fieldId,
      label,
      type,
      helperText,
      required,
      options,
    });
  }
  return result;
}

function normalizeFieldId(value: string): string {
  return value.trim();
}

function normalizeAnswerValue(
  fieldType: ChecklistFieldType,
  raw: unknown,
): ChecklistAnswerValue {
  if (raw === undefined || raw === null) return null;
  if (fieldType === 'boolean') {
    if (typeof raw === 'boolean') return raw;
    return null;
  }
  if (fieldType === 'number') {
    const num =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string'
          ? Number(raw)
          : NaN;
    return Number.isFinite(num) ? num : null;
  }
  if (fieldType === 'text') {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed.length ? trimmed : null;
  }
  // select
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : null;
}

export function validateAndNormalizeAnswers(params: {
  fields: ChecklistFieldDto[];
  answers: { fieldId: string; value?: unknown }[];
}): { normalized: { fieldId: string; value: ChecklistAnswerValue }[] } {
  const { fields, answers } = params;

  const fieldById = new Map<string, ChecklistFieldDto>();
  for (const field of fields) {
    const id = normalizeFieldId(field.fieldId);
    if (!id) {
      throw new BadRequestException({
        code: 'INVALID_FIELD_ID',
        message: 'Template enthaelt ein leeres Feld-ID.',
      });
    }
    if (fieldById.has(id)) {
      throw new BadRequestException({
        code: 'DUPLICATE_FIELD_ID',
        message: `Template enthaelt doppelte Feld-ID: ${id}`,
      });
    }
    fieldById.set(id, { ...field, fieldId: id });
  }

  const answerByFieldId = new Map<string, unknown>();
  for (const answer of answers) {
    const id = normalizeFieldId(answer.fieldId);
    if (!id) continue;
    if (answerByFieldId.has(id)) {
      throw new BadRequestException({
        code: 'DUPLICATE_ANSWER',
        message: `Antworten enthalten die Feld-ID mehrfach: ${id}`,
      });
    }
    answerByFieldId.set(id, answer.value);
  }

  const normalized = fields.map((field) => {
    const raw = answerByFieldId.get(field.fieldId);
    const value = normalizeAnswerValue(field.type, raw);

    if (field.required && (value === null || value === '')) {
      throw new BadRequestException({
        code: 'MISSING_REQUIRED_FIELD',
        message: `Pflichtfeld fehlt: ${field.label}`,
      });
    }

    if (field.type === 'select' && value != null) {
      const options = field.options ?? [];
      if (!options.includes(String(value))) {
        throw new BadRequestException({
          code: 'INVALID_OPTION',
          message: `Ungültige Auswahl für: ${field.label}`,
        });
      }
    }

    return { fieldId: field.fieldId, value };
  });

  for (const [fieldId] of answerByFieldId) {
    if (!fieldById.has(fieldId)) {
      throw new BadRequestException({
        code: 'UNKNOWN_FIELD',
        message: `Unbekanntes Feld: ${fieldId}`,
      });
    }
  }

  return { normalized };
}

@Injectable()
export class ChecklistenService {
  private readonly logger = new Logger(ChecklistenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
  ) {}

  async templatesAllActive(): Promise<ChecklistTemplateListItem[]> {
    await this.ensureDefaultTemplates();
    const rows = await this.prisma.checklistenTemplates.findMany({
      where: { is_active: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    return rows.map((r) => this.mapTemplate(r));
  }

  async templatesList(params: {
    page: number;
    pageSize: number;
    q?: string;
  }): Promise<PaginatedResponse<ChecklistTemplateListItem>> {
    await this.ensureDefaultTemplates();
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;
    const q = params.q?.trim();
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { description: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.checklistenTemplates.findMany({
        where,
        orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.checklistenTemplates.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.mapTemplate(r)),
      total,
      page,
      pageSize,
    };
  }

  async templateGet(id: number): Promise<ChecklistTemplateListItem> {
    await this.ensureDefaultTemplates();
    const row = await this.prisma.checklistenTemplates.findUnique({
      where: { id: BigInt(id) },
    });
    if (!row) throw new NotFoundException('Template nicht gefunden');
    return this.mapTemplate(row);
  }

  async templateCreate(
    dto: CreateChecklistTemplateDto,
  ): Promise<ChecklistTemplateListItem> {
    const row = await this.prisma.checklistenTemplates.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        fields: toJsonFields(dto.fields),
        is_active: dto.isActive ?? true,
      },
    });
    return this.mapTemplate(row);
  }

  async templateUpdate(
    id: number,
    dto: UpdateChecklistTemplateDto,
  ): Promise<ChecklistTemplateListItem> {
    const current = await this.prisma.checklistenTemplates.findUnique({
      where: { id: BigInt(id) },
    });
    if (!current) throw new NotFoundException('Template nicht gefunden');

    const nextVersion =
      dto.fields || dto.name || dto.description
        ? current.version + 1
        : current.version;

    const row = await this.prisma.checklistenTemplates.update({
      where: { id: BigInt(id) },
      data: {
        name: dto.name != null ? dto.name.trim() : undefined,
        description:
          dto.description != null ? dto.description.trim() || null : undefined,
        fields: dto.fields ? toJsonFields(dto.fields) : undefined,
        is_active: dto.isActive ?? undefined,
        version: nextVersion,
      },
    });
    return this.mapTemplate(row);
  }

  async submissionsList(
    query: ChecklistSubmissionListQueryDto,
    auth: Pick<AuthContext, 'role' | 'employeeId'>,
  ): Promise<PaginatedResponse<ChecklistSubmissionListItem>> {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ChecklistenSubmissionsWhereInput = {};
    if (query.objectId) where.objekt_id = BigInt(query.objectId);
    if (query.templateId) where.template_id = BigInt(query.templateId);

    if (auth.role === 'mitarbeiter') {
      if (auth.employeeId == null) {
        throw new BadRequestException({
          code: 'MISSING_EMPLOYEE_MAPPING',
          message:
            'Kein Mitarbeiter-Mapping vorhanden. Bitte Admin kontaktieren (User \u2194 Mitarbeiter zuordnen).',
        });
      }
      where.mitarbeiter_id = BigInt(auth.employeeId);
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.checklistenSubmissions.findMany({
        where,
        orderBy: { submitted_at: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          submitted_at: true,
          created_by_email: true,
          created_by_name: true,
          note: true,
          objekt: { select: { id: true, name: true } },
          template: { select: { id: true, name: true, version: true } },
          mitarbeiter: { select: { id: true, name: true } },
        },
      }),
      this.prisma.checklistenSubmissions.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: Number(r.id),
        submittedAt: r.submitted_at,
        object: { id: Number(r.objekt.id), name: r.objekt.name },
        template: {
          id: Number(r.template.id),
          name: r.template.name,
          version: r.template.version,
        },
        employee: r.mitarbeiter
          ? { id: Number(r.mitarbeiter.id), name: r.mitarbeiter.name }
          : null,
        createdByEmail: r.created_by_email,
        createdByName: r.created_by_name,
        note: r.note,
      })),
      total,
      page,
      pageSize,
    };
  }

  async submissionGet(
    id: number,
    auth: Pick<AuthContext, 'role' | 'employeeId'>,
  ): Promise<ChecklistSubmissionDetail> {
    const row = await this.prisma.checklistenSubmissions.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        submitted_at: true,
        created_by_email: true,
        created_by_name: true,
        note: true,
        template_snapshot: true,
        answers: true,
        objekt: { select: { id: true, name: true } },
        template: { select: { id: true, name: true, version: true } },
        mitarbeiter: { select: { id: true, name: true } },
        mitarbeiter_id: true,
      },
    });
    if (!row) throw new NotFoundException('Submission nicht gefunden');

    if (auth.role === 'mitarbeiter') {
      if (auth.employeeId == null) {
        throw new BadRequestException({
          code: 'MISSING_EMPLOYEE_MAPPING',
          message:
            'Kein Mitarbeiter-Mapping vorhanden. Bitte Admin kontaktieren (User \u2194 Mitarbeiter zuordnen).',
        });
      }
      const rowEmployeeId = row.mitarbeiter_id
        ? Number(row.mitarbeiter_id)
        : null;
      if (rowEmployeeId !== auth.employeeId) {
        throw new NotFoundException('Submission nicht gefunden');
      }
    }

    return {
      id: Number(row.id),
      submittedAt: row.submitted_at,
      object: { id: Number(row.objekt.id), name: row.objekt.name },
      template: {
        id: Number(row.template.id),
        name: row.template.name,
        version: row.template.version,
      },
      employee: row.mitarbeiter
        ? { id: Number(row.mitarbeiter.id), name: row.mitarbeiter.name }
        : null,
      createdByEmail: row.created_by_email,
      createdByName: row.created_by_name,
      note: row.note,
      templateSnapshot: row.template_snapshot,
      answers: row.answers,
    };
  }

  async submissionCreate(
    dto: CreateChecklistSubmissionDto,
    auth: AuthContext,
  ): Promise<{ id: number }> {
    const objectExists = await this.prisma.objekte.findUnique({
      where: { id: BigInt(dto.objectId) },
      select: { id: true, name: true },
    });
    if (!objectExists) {
      throw new BadRequestException({
        code: 'INVALID_OBJECT',
        message: 'Objekt existiert nicht. Bitte ein gültiges Objekt auswählen.',
      });
    }

    const template = await this.prisma.checklistenTemplates.findUnique({
      where: { id: BigInt(dto.templateId) },
      select: {
        id: true,
        name: true,
        description: true,
        version: true,
        fields: true,
        is_active: true,
      },
    });
    if (!template || !template.is_active) {
      throw new BadRequestException({
        code: 'INVALID_TEMPLATE',
        message: 'Template existiert nicht oder ist deaktiviert.',
      });
    }

    if (auth.role === 'mitarbeiter' && auth.employeeId == null) {
      throw new BadRequestException({
        code: 'MISSING_EMPLOYEE_MAPPING',
        message:
          'Kein Mitarbeiter-Mapping vorhanden. Bitte Admin kontaktieren (User \u2194 Mitarbeiter zuordnen).',
      });
    }

    const fields = parseJsonFields(template.fields);

    const { normalized } = validateAndNormalizeAnswers({
      fields,
      answers: dto.answers.map((a) => ({ fieldId: a.fieldId, value: a.value })),
    });

    const snapshot: Prisma.InputJsonObject = {
      templateId: Number(template.id),
      name: template.name,
      description: template.description,
      version: template.version,
      fields: toJsonFields(fields),
    };

    const note = dto.note?.trim();
    const row = await this.prisma.checklistenSubmissions.create({
      data: {
        template: { connect: { id: template.id } },
        objekt: { connect: { id: BigInt(dto.objectId) } },
        mitarbeiter:
          auth.employeeId != null
            ? { connect: { id: BigInt(auth.employeeId) } }
            : undefined,
        created_by_email: auth.user.email,
        created_by_name: auth.user.fullName || auth.user.email,
        template_snapshot: snapshot,
        answers: toJsonAnswers(normalized),
        note: note ? note : null,
      },
      select: { id: true },
    });

    this.logger.log(
      `Checklist submitted: id=${row.id.toString()} template=${dto.templateId} object=${dto.objectId} by=${auth.user.email}`,
    );

    await this.prisma.benachrichtigungen.create({
      data: {
        typ: 'MOBILE_CHECKLIST',
        titel: `Neue Checkliste: ${template.name} â€¢ ${objectExists.name}`,
        nachricht: note ? note : undefined,
        link: `/checklisten`,
        gelesen: false,
      },
    });

    await this.tasksService.upsertFromChecklistSubmission(Number(row.id));

    return { id: Number(row.id) };
  }

  private mapTemplate(row: {
    id: bigint;
    name: string;
    description: string | null;
    version: number;
    fields: unknown;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }): ChecklistTemplateListItem {
    const fields = parseJsonFields(row.fields);
    return {
      id: Number(row.id),
      name: row.name,
      description: row.description,
      version: row.version,
      isActive: row.is_active,
      fields,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private defaultsEnsured = false;

  private async ensureDefaultTemplates(): Promise<void> {
    if (this.defaultsEnsured) return;
    const count = await this.prisma.checklistenTemplates.count();
    if (count > 0) {
      this.defaultsEnsured = true;
      return;
    }

    const defaults: CreateChecklistTemplateDto[] = [
      {
        name: 'Winterdienst',
        description: 'Standard-Checkliste für Räumen/Streuen vor Ort.',
        isActive: true,
        fields: [
          { fieldId: 'area', label: 'Bereich', type: 'text', required: true },
          {
            fieldId: 'cleared',
            label: 'Geräumt',
            type: 'boolean',
            required: true,
          },
          {
            fieldId: 'salted',
            label: 'Gestreut',
            type: 'boolean',
            required: true,
          },
          {
            fieldId: 'hazards',
            label: 'Gefahrenstellen / Hinweise',
            type: 'text',
            required: false,
          },
        ],
      },
      {
        name: 'Gartenarbeit',
        description: 'Nachweis für regelmäßige Pflegearbeiten.',
        isActive: true,
        fields: [
          {
            fieldId: 'tasks',
            label: 'Arbeiten durchgeführt',
            type: 'text',
            required: true,
          },
          {
            fieldId: 'wasteRemoved',
            label: 'Grünschnitt entsorgt',
            type: 'boolean',
            required: false,
          },
          { fieldId: 'note', label: 'Notiz', type: 'text', required: false },
        ],
      },
      {
        name: 'Aufzugskontrolle',
        description: 'Kurzprotokoll für die Sicht-/Funktionskontrolle.',
        isActive: true,
        fields: [
          {
            fieldId: 'cabinClean',
            label: 'Kabine sauber',
            type: 'boolean',
            required: true,
          },
          {
            fieldId: 'doorsOk',
            label: 'Türen / Schließung ok',
            type: 'boolean',
            required: true,
          },
          {
            fieldId: 'alarmOk',
            label: 'Notruf/Alarm ok',
            type: 'boolean',
            required: true,
          },
          {
            fieldId: 'issues',
            label: 'Auffälligkeiten',
            type: 'text',
            required: false,
          },
        ],
      },
    ];

    await this.prisma.checklistenTemplates.createMany({
      data: defaults.map((d) => ({
        name: d.name,
        description: d.description ?? null,
        fields: toJsonFields(d.fields),
        is_active: d.isActive ?? true,
      })),
    });
    this.defaultsEnsured = true;
    this.logger.log('Default Checklist-Templates erstellt (MVP Seed).');
  }
}
