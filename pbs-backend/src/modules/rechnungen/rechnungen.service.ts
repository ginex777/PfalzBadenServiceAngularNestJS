import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RechnungenService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async alleRechnungenLaden() {
    const rows = await this.prisma.rechnungen.findMany({ orderBy: [{ datum: 'desc' }, { id: 'desc' }] });
    return rows.map(r => this.mapRechnung(r));
  }

  async rechnungErstellen(daten: Record<string, unknown>) {
    const nr = String(daten['nr'] ?? '');
    const vorhanden = await this.prisma.rechnungen.findUnique({ where: { nr } });
    if (vorhanden) throw new ConflictException(`Rechnungsnummer "${nr}" existiert bereits.`);

    const rechnung = await this.prisma.rechnungen.create({
      data: this.rechnungDatenMappen(daten),
    });
    await this.audit.protokollieren('rechnungen', rechnung.id, 'CREATE', null, rechnung);
    return this.mapRechnung(rechnung);
  }

  async rechnungAktualisieren(id: number, daten: Record<string, unknown>) {
    const alt = await this.prisma.rechnungen.findUnique({ where: { id: BigInt(id) } });
    if (!alt) throw new NotFoundException(`Rechnung ${id} nicht gefunden`);

    // GoBD §146 AO: Bezahlte Rechnungen — nur Zahlungsstatus änderbar
    if (alt.bezahlt && daten['bezahlt'] !== false) {
      throw new ForbiddenException('Bezahlte Rechnungen dürfen inhaltlich nicht geändert werden (GoBD §146 AO).');
    }

    // Duplikat-Check bei Nr-Änderung
    const neueNr = String(daten['nr'] ?? '');
    if (neueNr !== alt.nr) {
      const dup = await this.prisma.rechnungen.findFirst({ where: { nr: neueNr, id: { not: BigInt(id) } } });
      if (dup) throw new ConflictException(`Rechnungsnummer "${neueNr}" existiert bereits.`);
    }

    const neu = await this.prisma.rechnungen.update({
      where: { id: BigInt(id) },
      data: this.rechnungDatenMappen(daten),
    });
    await this.audit.protokollieren('rechnungen', BigInt(id), 'UPDATE', alt, neu);
    return this.mapRechnung(neu);
  }

  async rechnungLoeschen(id: number) {
    const alt = await this.prisma.rechnungen.findUnique({ where: { id: BigInt(id) } });
    if (!alt) throw new NotFoundException(`Rechnung ${id} nicht gefunden`);
    if (alt.bezahlt) throw new ForbiddenException('Bezahlte Rechnungen können nicht gelöscht werden (GoBD §146 AO).');
    await this.prisma.rechnungen.delete({ where: { id: BigInt(id) } });
    await this.audit.protokollieren('rechnungen', BigInt(id), 'DELETE', alt, null);
    return { ok: true };
  }

  private rechnungDatenMappen(d: Record<string, unknown>): Prisma.RechnungenCreateInput {
    return {
      nr: String(d['nr'] ?? ''),
      empf: String(d['empf'] ?? ''),
      str: d['str'] ? String(d['str']) : null,
      ort: d['ort'] ? String(d['ort']) : null,
      titel: d['titel'] ? String(d['titel']) : null,
      datum: d['datum'] ? new Date(String(d['datum'])) : null,
      leistungsdatum: d['leistungsdatum'] ? String(d['leistungsdatum']) : null,
      email: d['email'] ? String(d['email']) : null,
      zahlungsziel: d['zahlungsziel'] ? Number(d['zahlungsziel']) : 14,
      kunden: d['kunden_id'] ? { connect: { id: BigInt(Number(d['kunden_id'])) } } : undefined,
      brutto: new Prisma.Decimal(Number(d['brutto'] ?? 0)),
      frist: d['frist'] ? new Date(String(d['frist'])) : null,
      bezahlt: Boolean(d['bezahlt']),
      bezahlt_am: d['bezahlt_am'] ? new Date(String(d['bezahlt_am'])) : null,
      positionen: (d['positionen'] as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      mwst_satz: new Prisma.Decimal(Number(d['mwst_satz'] ?? 19)),
    };
  }

  private mapRechnung(r: Record<string, unknown>) {
    return {
      ...r,
      id: Number(r['id']),
      kunden_id: r['kunden_id'] ? Number(r['kunden_id']) : null,
      brutto: Number(r['brutto']),
      mwst_satz: Number(r['mwst_satz']),
      bezahlt: Boolean(r['bezahlt']),
    };
  }
}
