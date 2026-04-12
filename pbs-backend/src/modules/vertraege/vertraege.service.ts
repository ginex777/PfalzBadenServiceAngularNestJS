import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class VertraegeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async alleLaden(kundenId?: number) {
    const rows = await this.prisma.vertraege.findMany({
      where: kundenId ? { kunden_id: BigInt(kundenId) } : undefined,
      orderBy: { created_at: 'desc' },
    });
    return rows.map(v => this._map(v));
  }

  async einenLaden(id: number) {
    const v = await this.prisma.vertraege.findUnique({ where: { id: BigInt(id) } });
    if (!v) throw new NotFoundException(`Vertrag ${id} nicht gefunden`);
    return this._map(v);
  }

  async erstellen(d: Record<string, unknown>, nutzer?: string) {
    const v = await this.prisma.vertraege.create({
      data: {
        kunden_id: d['kunden_id'] ? BigInt(Number(d['kunden_id'])) : null,
        kunden_name: String(d['kunden_name'] ?? ''),
        kunden_strasse: d['kunden_strasse'] ? String(d['kunden_strasse']) : null,
        kunden_ort: d['kunden_ort'] ? String(d['kunden_ort']) : null,
        vorlage: String(d['vorlage'] ?? 'Dienstleistungsvertrag'),
        titel: String(d['titel'] ?? ''),
        vertragsbeginn: new Date(String(d['vertragsbeginn'])),
        laufzeit_monate: Number(d['laufzeit_monate'] ?? 12),
        monatliche_rate: new Prisma.Decimal(Number(d['monatliche_rate'] ?? 0)),
        leistungsumfang: d['leistungsumfang'] ? String(d['leistungsumfang']) : null,
        kuendigungsfrist: Number(d['kuendigungsfrist'] ?? 3),
        status: 'aktiv',
      },
    });
    await this.audit.protokollieren('vertraege', v.id, 'CREATE', null, this._map(v), nutzer);
    return this._map(v);
  }

  async aktualisieren(id: number, d: Record<string, unknown>, nutzer?: string) {
    const alt = await this.prisma.vertraege.findUnique({ where: { id: BigInt(id) } });
    if (!alt) throw new NotFoundException();
    const v = await this.prisma.vertraege.update({
      where: { id: BigInt(id) },
      data: {
        kunden_name: d['kunden_name'] ? String(d['kunden_name']) : undefined,
        kunden_strasse: d['kunden_strasse'] !== undefined ? (d['kunden_strasse'] ? String(d['kunden_strasse']) : null) : undefined,
        kunden_ort: d['kunden_ort'] !== undefined ? (d['kunden_ort'] ? String(d['kunden_ort']) : null) : undefined,
        vorlage: d['vorlage'] ? String(d['vorlage']) : undefined,
        titel: d['titel'] ? String(d['titel']) : undefined,
        vertragsbeginn: d['vertragsbeginn'] ? new Date(String(d['vertragsbeginn'])) : undefined,
        laufzeit_monate: d['laufzeit_monate'] !== undefined ? Number(d['laufzeit_monate']) : undefined,
        monatliche_rate: d['monatliche_rate'] !== undefined ? new Prisma.Decimal(Number(d['monatliche_rate'])) : undefined,
        leistungsumfang: d['leistungsumfang'] !== undefined ? (d['leistungsumfang'] ? String(d['leistungsumfang']) : null) : undefined,
        kuendigungsfrist: d['kuendigungsfrist'] !== undefined ? Number(d['kuendigungsfrist']) : undefined,
        status: d['status'] ? String(d['status']) : undefined,
        pdf_filename: d['pdf_filename'] !== undefined ? (d['pdf_filename'] ? String(d['pdf_filename']) : null) : undefined,
        html_body: d['html_body'] !== undefined ? (d['html_body'] ? String(d['html_body']) : null) : undefined,
      },
    });
    await this.audit.protokollieren('vertraege', v.id, 'UPDATE', this._map(alt), this._map(v), nutzer);
    return this._map(v);
  }

  async loeschen(id: number, nutzer?: string) {
    const v = await this.prisma.vertraege.findUnique({ where: { id: BigInt(id) } });
    if (!v) throw new NotFoundException();
    await this.prisma.vertraege.delete({ where: { id: BigInt(id) } });
    await this.audit.protokollieren('vertraege', v.id, 'DELETE', this._map(v), null, nutzer);
    return { ok: true };
  }

  private _map(v: {
    id: bigint; kunden_id: bigint | null; kunden_name: string;
    kunden_strasse: string | null; kunden_ort: string | null;
    vorlage: string; titel: string; vertragsbeginn: Date;
    laufzeit_monate: number; monatliche_rate: Prisma.Decimal;
    leistungsumfang: string | null; kuendigungsfrist: number;
    pdf_filename: string | null; html_body: string | null;
    status: string; created_at: Date; updated_at: Date;
  }) {
    return {
      ...v,
      id: Number(v.id),
      kunden_id: v.kunden_id ? Number(v.kunden_id) : null,
      monatliche_rate: Number(v.monatliche_rate),
      html_body: undefined, // never send html_body over API
    };
  }
}
