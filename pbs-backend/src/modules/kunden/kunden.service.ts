import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';

function validEmail(v: unknown): boolean {
  if (!v) return true; // optional
  return /^[^\s@]{1,254}@[^\s@]+\.[^\s@]+$/.test(String(v));
}

@Injectable()
export class KundenService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async alleKundenLaden() {
    const rows = await this.prisma.kunden.findMany({ orderBy: { name: 'asc' } });
    return rows.map(r => ({ ...r, id: Number(r.id) }));
  }

  async kundeErstellen(daten: Record<string, unknown>, nutzer?: string) {
    const name = String(daten['name'] ?? '').trim();
    if (!name) throw new BadRequestException('Name ist erforderlich');
    if (!validEmail(daten['email'])) throw new BadRequestException('Ungültige E-Mail-Adresse');
    const kunde = await this.prisma.kunden.create({
      data: {
        name,
        strasse: daten['strasse'] ? String(daten['strasse']) : null,
        ort: daten['ort'] ? String(daten['ort']) : null,
        tel: daten['tel'] ? String(daten['tel']) : null,
        email: daten['email'] ? String(daten['email']) : null,
        notiz: daten['notiz'] ? String(daten['notiz']) : null,
      },
    });
    await this.audit.protokollieren('kunden', kunde.id, 'CREATE', null, kunde, nutzer);
    return { ...kunde, id: Number(kunde.id) };
  }

  async kundeAktualisieren(id: number, daten: Record<string, unknown>, nutzer?: string) {
    const alt = await this.prisma.kunden.findUnique({ where: { id: BigInt(id) } });
    if (!alt) throw new NotFoundException(`Kunde ${id} nicht gefunden`);
    if (!validEmail(daten['email'])) throw new BadRequestException('Ungültige E-Mail-Adresse');
    const neu = await this.prisma.kunden.update({
      where: { id: BigInt(id) },
      data: {
        name: String(daten['name'] ?? ''),
        strasse: daten['strasse'] ? String(daten['strasse']) : null,
        ort: daten['ort'] ? String(daten['ort']) : null,
        tel: daten['tel'] ? String(daten['tel']) : null,
        email: daten['email'] ? String(daten['email']) : null,
        notiz: daten['notiz'] ? String(daten['notiz']) : null,
      },
    });
    await this.audit.protokollieren('kunden', BigInt(id), 'UPDATE', alt, neu, nutzer);
    return { ...neu, id: Number(neu.id) };
  }

  async kundeLoeschen(id: number, nutzer?: string) {
    const alt = await this.prisma.kunden.findUnique({ where: { id: BigInt(id) } });
    if (!alt) throw new NotFoundException(`Kunde ${id} nicht gefunden`);
    const reCount = await this.prisma.rechnungen.count({ where: { kunden_id: BigInt(id) } });
    const angCount = await this.prisma.angebote.count({ where: { kunden_id: BigInt(id) } });
    if (reCount + angCount > 0) {
      throw new ConflictException(`Kunde kann nicht gelöscht werden: ${reCount} Rechnung(en) und ${angCount} Angebot(e) verknüpft.`);
    }
    await this.prisma.kunden.delete({ where: { id: BigInt(id) } });
    await this.audit.protokollieren('kunden', BigInt(id), 'DELETE', alt, null, nutzer);
    return { ok: true };
  }
}
