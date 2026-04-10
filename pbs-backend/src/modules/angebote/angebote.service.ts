import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AngeboteService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async alleAngeboteLaden() {
    const rows = await this.prisma.angebote.findMany({ orderBy: [{ datum: 'desc' }, { id: 'desc' }] });
    return rows.map(r => this.mapAngebot(r));
  }

  async angebotErstellen(daten: Record<string, unknown>) {
    const angebot = await this.prisma.angebote.create({ data: this.angebotDatenMappen(daten) });
    await this.audit.protokollieren('angebote', angebot.id, 'CREATE', null, angebot);
    return this.mapAngebot(angebot);
  }

  async angebotAktualisieren(id: number, daten: Record<string, unknown>) {
    const alt = await this.prisma.angebote.findUnique({ where: { id: BigInt(id) } });
    if (!alt) throw new NotFoundException(`Angebot ${id} nicht gefunden`);
    const neu = await this.prisma.angebote.update({ where: { id: BigInt(id) }, data: this.angebotDatenMappen(daten) });
    await this.audit.protokollieren('angebote', BigInt(id), 'UPDATE', alt, neu);
    return this.mapAngebot(neu);
  }

  async angebotLoeschen(id: number) {
    const alt = await this.prisma.angebote.findUnique({ where: { id: BigInt(id) } });
    if (!alt) throw new NotFoundException(`Angebot ${id} nicht gefunden`);
    await this.prisma.angebote.delete({ where: { id: BigInt(id) } });
    await this.audit.protokollieren('angebote', BigInt(id), 'DELETE', alt, null);
    return { ok: true };
  }

  private angebotDatenMappen(d: Record<string, unknown>): Prisma.AngeboteCreateInput {
    return {
      nr: String(d['nr'] ?? ''),
      empf: String(d['empf'] ?? ''),
      str: d['str'] ? String(d['str']) : null,
      ort: d['ort'] ? String(d['ort']) : null,
      titel: d['titel'] ? String(d['titel']) : null,
      datum: d['datum'] ? new Date(String(d['datum'])) : null,
      brutto: new Prisma.Decimal(Number(d['brutto'] ?? 0)),
      gueltig_bis: d['gueltig_bis'] ? new Date(String(d['gueltig_bis'])) : null,
      angenommen: Boolean(d['angenommen']),
      abgelehnt: Boolean(d['abgelehnt']),
      gesendet: Boolean(d['gesendet']),
      zusatz: d['zusatz'] ? String(d['zusatz']) : null,
      positionen: (d['positionen'] as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      kunden: d['kunden_id'] ? { connect: { id: BigInt(Number(d['kunden_id'])) } } : undefined,
    };
  }

  private mapAngebot(r: Record<string, unknown>) {
    return {
      ...r,
      id: Number(r['id']),
      kunden_id: r['kunden_id'] ? Number(r['kunden_id']) : null,
      brutto: Number(r['brutto']),
      angenommen: Boolean(r['angenommen']),
      abgelehnt: Boolean(r['abgelehnt']),
      gesendet: Boolean(r['gesendet']),
    };
  }
}
