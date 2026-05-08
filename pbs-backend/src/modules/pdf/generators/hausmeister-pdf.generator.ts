import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { PdfRenderService } from '../pdf-render.service';
import { PdfTokenService } from '../pdf-token.service';

const MONATE_DE = [
  'Januar',
  'Februar',
  'MÃ¤rz',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

@Injectable()
export class HausmeisterPdfGenerator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly render: PdfRenderService,
    private readonly token: PdfTokenService,
  ) {}

  async createEinsatzPdf(
    einsatzId: number,
    auth: { role: string; employeeId: number | null },
  ): Promise<{ token: string; url: string }> {
    const einsatz = await this.prisma.hausmeisterEinsaetze.findUnique({
      where: { id: BigInt(einsatzId) },
    });
    if (!einsatz)
      throw new NotFoundException(`Einsatz ${einsatzId} nicht gefunden`);
    if (auth.role === 'mitarbeiter') {
      this.requireEmployeeMapping(auth);
      const rowEmployeeId = einsatz.mitarbeiter_id
        ? Number(einsatz.mitarbeiter_id)
        : null;
      if (rowEmployeeId !== auth.employeeId) {
        throw new NotFoundException(`Einsatz ${einsatzId} nicht gefunden`);
      }
    }
    const firma = await this.render.loadFirma();
    const now = new Date().toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const taetigkeiten =
      (einsatz.taetigkeiten as Array<{
        beschreibung: string;
        stunden: number;
      }>) ?? [];

    const kontext = {
      firma,
      logoBase64: this.render.logoBase64,
      erstelltAm: now,
      einsatz: {
        ...einsatz,
        id: Number(einsatz.id),
        mitarbeiter_id: einsatz.mitarbeiter_id
          ? Number(einsatz.mitarbeiter_id)
          : null,
        kunden_id: einsatz.kunden_id ? Number(einsatz.kunden_id) : null,
        stunden_gesamt: Number(einsatz.stunden_gesamt),
        taetigkeiten,
        datumFormatiert: this.render.formatDate(
          einsatz.datum.toISOString().slice(0, 10),
        ),
      },
    };

    const html = this.render.renderTemplate('hausmeister.hbs', kontext);
    const pdf = await this.render.createPdfWithHeaderFooter(html, firma);
    const filename = `Hausmeister_${einsatz.mitarbeiter_name.replace(/\s+/g, '_')}_${einsatz.datum.toISOString().slice(0, 10)}.pdf`;

    await this.prisma.pdfArchive.create({
      data: {
        typ: 'hausmeister',
        referenz_nr: einsatz.datum.toISOString().slice(0, 10),
        referenz_id: einsatz.id,
        empf: einsatz.mitarbeiter_name,
        titel: `Hausmeisterdienste ${this.render.formatDate(einsatz.datum.toISOString().slice(0, 10))}${einsatz.kunden_name ? ` â€“ ${einsatz.kunden_name}` : ''}`,
        datum: einsatz.datum,
        filename,
        html_body: html,
      },
    });

    return this.token.createToken(pdf, filename);
  }

  async createMonatsnachweisPdf(
    monat: string,
    mitarbeiterName?: string,
    auth?: { role: string; employeeId: number | null },
  ): Promise<{ token: string; url: string }> {
    const [y, mo] = monat.split('-').map(Number);
    const vonDatum = new Date(y, mo - 1, 1);
    const bisDatum = new Date(y, mo, 0);
    const firma = await this.render.loadFirma();
    const now = new Date().toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const where: Prisma.HausmeisterEinsaetzeWhereInput = {
      datum: { gte: vonDatum, lte: bisDatum },
    };
    if (auth?.role === 'mitarbeiter') {
      this.requireEmployeeMapping(auth);
      where.mitarbeiter_id = BigInt(auth.employeeId);
    } else if (mitarbeiterName) {
      where.mitarbeiter_name = mitarbeiterName;
    }

    const rows = await this.prisma.hausmeisterEinsaetze.findMany({
      where,
      orderBy: { datum: 'asc' },
    });
    const monatName = `${MONATE_DE[mo - 1]} ${y}`;
    const titel = mitarbeiterName
      ? `Monatsnachweis ${mitarbeiterName} â€“ ${monatName}`
      : `Monatsnachweis ${monatName}`;

    const einsaetze = rows.map((e) => ({
      ...e,
      id: Number(e.id),
      stunden_gesamt: Number(e.stunden_gesamt),
      datumFormatiert: this.render.formatDate(
        e.datum.toISOString().slice(0, 10),
      ),
      taetigkeiten:
        (e.taetigkeiten as Array<{ beschreibung: string; stunden: number }>) ??
        [],
      taetigkeitenText: (
        (e.taetigkeiten as Array<{ beschreibung: string; stunden: number }>) ??
        []
      )
        .map(
          (t) =>
            `${t.beschreibung} (${t.stunden.toLocaleString('de-DE', { minimumFractionDigits: 1 })}h)`,
        )
        .join(', '),
    }));

    const gesamtStunden = einsaetze.reduce((s, e) => s + e.stunden_gesamt, 0);
    const kontext = {
      firma,
      logoBase64: this.render.logoBase64,
      erstelltAm: now,
      titel,
      einsaetze,
      anzahl: einsaetze.length,
      gesamtStunden,
    };

    const html = this.render.renderTemplate('hausmeister-monat.hbs', kontext);
    const pdf = await this.render.createPdfWithHeaderFooter(html, firma);
    const filename = `Monatsnachweis_Hausmeister_${mitarbeiterName ? `${mitarbeiterName.replace(/\s+/g, '_')}_` : ''}${monat}.pdf`;

    await this.prisma.pdfArchive.create({
      data: {
        typ: 'hausmeister',
        referenz_nr: monat,
        empf: mitarbeiterName ?? 'Alle Mitarbeiter',
        titel,
        filename,
        html_body: html,
      },
    });

    return this.token.createToken(pdf, filename);
  }

  private requireEmployeeMapping(auth: {
    role: string;
    employeeId: number | null;
  }): asserts auth is { role: string; employeeId: number } {
    if (auth.employeeId == null) {
      throw new BadRequestException({
        code: 'MISSING_EMPLOYEE_MAPPING',
        message:
          'Kein Mitarbeiter-Mapping vorhanden. Bitte Admin kontaktieren (User <-> Mitarbeiter zuordnen).',
      });
    }
  }
}
