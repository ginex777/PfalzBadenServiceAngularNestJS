import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { PdfRenderService } from '../pdf-render.service';
import { PdfTokenService } from '../pdf-token.service';

type AuthContext = { role: string; employeeId: number | null };

type ChecklistField = {
  fieldId: string;
  label: string;
  type: 'boolean' | 'text' | 'number' | 'select';
};

type ChecklistAnswer = { fieldId: string; value: unknown };

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'â€”';
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  if (typeof value === 'number')
    return Number.isFinite(value) ? String(value) : 'â€”';
  if (typeof value === 'string') return value.trim() || 'â€”';
  return 'â€”';
}

@Injectable()
export class ChecklistePdfGenerator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly render: PdfRenderService,
    private readonly token: PdfTokenService,
  ) {}

  async createSubmissionPdf(
    submissionId: number,
    auth: AuthContext,
  ): Promise<{ token: string; url: string }> {
    const row = await this.prisma.checklistenSubmissions.findUnique({
      where: { id: BigInt(submissionId) },
      select: {
        id: true,
        submitted_at: true,
        note: true,
        created_by_email: true,
        created_by_name: true,
        template_snapshot: true,
        answers: true,
        objekt: { select: { id: true, name: true, strasse: true, ort: true } },
        mitarbeiter: { select: { id: true, name: true } },
        mitarbeiter_id: true,
      },
    });
    if (!row)
      throw new NotFoundException(`Submission ${submissionId} nicht gefunden`);

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
        throw new NotFoundException(
          `Submission ${submissionId} nicht gefunden`,
        );
      }
    }

    const snapshot = row.template_snapshot as {
      name?: string;
      version?: number;
      fields?: unknown;
    };
    const fields = asArray<ChecklistField>(snapshot.fields);
    const answers = asArray<ChecklistAnswer>(row.answers);

    const answerByFieldId = new Map<string, unknown>();
    for (const a of answers) {
      if (!a || typeof a !== 'object') continue;
      const fieldId =
        typeof (a as { fieldId?: unknown }).fieldId === 'string'
          ? String((a as { fieldId?: unknown }).fieldId)
          : '';
      if (!fieldId) continue;
      answerByFieldId.set(fieldId, (a as { value?: unknown }).value);
    }

    const items = fields.map((f) => ({
      label: f.label,
      value: formatValue(answerByFieldId.get(f.fieldId)),
    }));

    const firma = await this.render.loadFirma();
    const erstelltAm = new Date().toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const datum = row.submitted_at.toISOString().slice(0, 10);
    const templateName = snapshot.name ?? 'Checkliste';
    const version = snapshot.version ?? 1;

    const context = {
      firma,
      logoBase64: this.render.logoBase64,
      erstelltAm,
      submission: {
        id: Number(row.id),
        submittedAt: row.submitted_at.toLocaleString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        note: row.note,
        createdBy: row.created_by_name ?? row.created_by_email,
      },
      template: { name: templateName, version },
      objekt: {
        id: Number(row.objekt.id),
        name: row.objekt.name,
        address:
          `${row.objekt.strasse ?? ''} ${row.objekt.ort ?? ''}`.trim() || null,
      },
      mitarbeiter: row.mitarbeiter
        ? { id: Number(row.mitarbeiter.id), name: row.mitarbeiter.name }
        : null,
      items,
    };

    const html = this.render.renderTemplate('checkliste.hbs', context);
    const pdf = await this.render.createPdfWithHeaderFooter(html, firma);
    const safeObject = row.objekt.name.replace(/\s+/g, '_').slice(0, 40);
    const filename =
      `Checkliste_${templateName.replace(/\s+/g, '_')}_Objekt_${safeObject}_${datum}.pdf`.slice(
        0,
        100,
      );

    await this.prisma.pdfArchive.create({
      data: {
        typ: 'checkliste',
        referenz_nr: templateName,
        referenz_id: row.id,
        empf: row.objekt.name,
        titel: `Checkliste ${templateName} (v${version}) \u2013 ${row.objekt.name}`,
        datum: row.submitted_at,
        filename,
        html_body: html,
      },
    });

    return this.token.createToken(pdf, filename);
  }
}
