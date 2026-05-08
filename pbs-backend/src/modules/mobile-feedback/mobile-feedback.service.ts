import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AccessPolicyService } from '../access-policy/access-policy.service';
import type { AccessPolicyAuth } from '../access-policy/access-policy.service';

export type MobileFeedbackKind = 'EVIDENCE' | 'CHECKLIST';

export interface MobileFeedbackItem {
  kind: MobileFeedbackKind;
  id: number;
  createdAt: Date;
  objectId: number;
  objectName: string;
  title: string;
  subtitle: string | null;
  link: string;
  createdByEmail: string | null;
  createdByName: string | null;
}

export interface MobileFeedbackPage {
  data: MobileFeedbackItem[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class MobileFeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessPolicy: AccessPolicyService,
  ) {}

  async list(params: {
    page: number;
    pageSize: number;
    objectId?: number;
    auth: AccessPolicyAuth;
  }): Promise<MobileFeedbackPage> {
    const page = Math.max(1, params.page);
    const pageSize = Math.min(Math.max(1, params.pageSize), 200);
    const objectId = params.objectId;
    if (objectId) {
      await this.accessPolicy.assertCanAccessObject(params.auth, objectId);
    }

    const whereEvidence = objectId ? { objekt_id: BigInt(objectId) } : {};
    const whereChecklist = objectId ? { objekt_id: BigInt(objectId) } : {};

    const [evidenceTotal, checklistTotal] = await Promise.all([
      this.prisma.nachweise.count({ where: whereEvidence }),
      this.prisma.checklistenSubmissions.count({ where: whereChecklist }),
    ]);

    const needed = Math.min(page * pageSize, 500);

    const [evidenceRows, checklistRows] = await Promise.all([
      this.prisma.nachweise.findMany({
        where: whereEvidence,
        orderBy: { erstellt_am: 'desc' },
        take: needed,
        select: {
          id: true,
          objekt_id: true,
          filename: true,
          notiz: true,
          erstellt_am: true,
          erstellt_von: true,
          erstellt_von_name: true,
          objekte: { select: { name: true } },
        },
      }),
      this.prisma.checklistenSubmissions.findMany({
        where: whereChecklist,
        orderBy: { submitted_at: 'desc' },
        take: needed,
        select: {
          id: true,
          objekt_id: true,
          submitted_at: true,
          note: true,
          created_by_email: true,
          created_by_name: true,
          template: { select: { name: true } },
          objekt: { select: { name: true } },
        },
      }),
    ]);

    const merged: MobileFeedbackItem[] = [
      ...evidenceRows.map((r) => ({
        kind: 'EVIDENCE' as const,
        id: Number(r.id),
        createdAt: r.erstellt_am,
        objectId: Number(r.objekt_id),
        objectName: r.objekte.name,
        title: r.filename,
        subtitle: r.notiz,
        link: `/nachweise`,
        createdByEmail: r.erstellt_von ?? null,
        createdByName: r.erstellt_von_name ?? null,
      })),
      ...checklistRows.map((r) => ({
        kind: 'CHECKLIST' as const,
        id: Number(r.id),
        createdAt: r.submitted_at,
        objectId: Number(r.objekt_id),
        objectName: r.objekt.name,
        title: r.template.name,
        subtitle: r.note,
        link: `/checklisten`,
        createdByEmail: r.created_by_email,
        createdByName: r.created_by_name,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const start = (page - 1) * pageSize;
    const data = merged.slice(start, start + pageSize);

    return {
      data,
      total: evidenceTotal + checklistTotal,
      page,
      pageSize,
    };
  }
}
