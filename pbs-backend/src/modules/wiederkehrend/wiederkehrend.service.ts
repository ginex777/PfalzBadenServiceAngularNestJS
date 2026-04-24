import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import {
  Prisma,
  WiederkehrendeAusgaben,
  WiederkehrendeRechnungen,
} from '@prisma/client';
import {
  CreateWiederkehrendeAusgabeDto,
  CreateWiederkehrendeRechnungDto,
  UpdateWiederkehrendeAusgabeDto,
  UpdateWiederkehrendeRechnungDto,
} from './dto/wiederkehrend.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@Injectable()
export class WiederkehrendService {
  private readonly logger = new Logger(WiederkehrendService.name);

  constructor(private readonly prisma: PrismaService) {}

  async ausgabenLaden(
    pagination: PaginationDto,
  ): Promise<
    PaginatedResponse<
      ReturnType<WiederkehrendService['mapWiederkehrendeAusgabe']>
    >
  > {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.wiederkehrendeAusgaben.findMany({
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.wiederkehrendeAusgaben.count(),
    ]);
    return {
      data: rows.map((a) => this.mapWiederkehrendeAusgabe(a)),
      total,
      page,
      pageSize,
    };
  }

  async ausgabeErstellen(d: CreateWiederkehrendeAusgabeDto) {
    const a = await this.prisma.wiederkehrendeAusgaben.create({
      data: {
        name: d.name,
        kategorie: d.kategorie ?? 'Betriebsausgabe',
        brutto: new Prisma.Decimal(d.brutto ?? 0),
        mwst: new Prisma.Decimal(d.mwst ?? 19),
        abzug: new Prisma.Decimal(d.abzug ?? 100),
        belegnr: d.belegnr ?? null,
        aktiv: d.aktiv !== false,
      },
    });
    return {
      ...a,
      id: Number(a.id),
      brutto: Number(a.brutto),
      mwst: Number(a.mwst),
      abzug: Number(a.abzug),
    };
  }

  async ausgabeAktualisieren(id: number, d: UpdateWiederkehrendeAusgabeDto) {
    if (
      !(await this.prisma.wiederkehrendeAusgaben.findUnique({
        where: { id: BigInt(id) },
      }))
    )
      throw new NotFoundException();
    const a = await this.prisma.wiederkehrendeAusgaben.update({
      where: { id: BigInt(id) },
      data: {
        name: d.name,
        kategorie: d.kategorie ?? 'Betriebsausgabe',
        brutto: new Prisma.Decimal(d.brutto ?? 0),
        mwst: new Prisma.Decimal(d.mwst ?? 19),
        abzug: new Prisma.Decimal(d.abzug ?? 100),
        belegnr: d.belegnr ?? null,
        aktiv: d.aktiv ?? false,
      },
    });
    return {
      ...a,
      id: Number(a.id),
      brutto: Number(a.brutto),
      mwst: Number(a.mwst),
      abzug: Number(a.abzug),
    };
  }

  async ausgabeLoeschen(id: number) {
    if (
      !(await this.prisma.wiederkehrendeAusgaben.findUnique({
        where: { id: BigInt(id) },
      }))
    )
      throw new NotFoundException();
    await this.prisma.wiederkehrendeAusgaben.delete({
      where: { id: BigInt(id) },
    });
    return { ok: true };
  }

  async rechnungenLaden(
    pagination: PaginationDto,
  ): Promise<
    PaginatedResponse<
      ReturnType<WiederkehrendService['mapWiederkehrendeRechnung']>
    >
  > {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.wiederkehrendeRechnungen.findMany({
        orderBy: { titel: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.wiederkehrendeRechnungen.count(),
    ]);
    return {
      data: rows.map((r) => this.mapWiederkehrendeRechnung(r)),
      total,
      page,
      pageSize,
    };
  }

  async rechnungErstellen(d: CreateWiederkehrendeRechnungDto) {
    const positionen: Prisma.JsonArray = d.positionen.map((position) => ({
      bez: position.bez,
      stunden: position.stunden ?? null,
      einzelpreis: position.einzelpreis ?? null,
      gesamtpreis: position.gesamtpreis,
    }));
    const r = await this.prisma.wiederkehrendeRechnungen.create({
      data: {
        kunden_id: d.kunden_id ? BigInt(d.kunden_id) : null,
        kunden_name: d.kunden_name ?? null,
        titel: d.titel,
        positionen,
        intervall: d.intervall ?? 'monatlich',
        aktiv: d.aktiv !== false,
      },
    });
    return {
      ...r,
      id: Number(r.id),
      kunden_id: r.kunden_id ? Number(r.kunden_id) : null,
    };
  }

  async rechnungAktualisieren(id: number, d: UpdateWiederkehrendeRechnungDto) {
    if (
      !(await this.prisma.wiederkehrendeRechnungen.findUnique({
        where: { id: BigInt(id) },
      }))
    )
      throw new NotFoundException();
    const r = await this.prisma.wiederkehrendeRechnungen.update({
      where: { id: BigInt(id) },
      data: {
        kunden_id: d.kunden_id ? BigInt(d.kunden_id) : null,
        kunden_name: d.kunden_name ?? null,
        titel: d.titel,
        positionen: d.positionen.map((position) => ({
          bez: position.bez,
          stunden: position.stunden ?? null,
          einzelpreis: position.einzelpreis ?? null,
          gesamtpreis: position.gesamtpreis,
        })),
        intervall: d.intervall ?? 'monatlich',
        aktiv: d.aktiv ?? false,
        letzte_erstellung: d.letzte_erstellung
          ? new Date(d.letzte_erstellung)
          : null,
      },
    });
    return {
      ...r,
      id: Number(r.id),
      kunden_id: r.kunden_id ? Number(r.kunden_id) : null,
    };
  }

  async rechnungLoeschen(id: number) {
    if (
      !(await this.prisma.wiederkehrendeRechnungen.findUnique({
        where: { id: BigInt(id) },
      }))
    )
      throw new NotFoundException();
    await this.prisma.wiederkehrendeRechnungen.delete({
      where: { id: BigInt(id) },
    });
    return { ok: true };
  }

  private mapWiederkehrendeAusgabe(a: WiederkehrendeAusgaben) {
    return {
      ...a,
      id: Number(a.id),
      brutto: Number(a.brutto),
      mwst: Number(a.mwst),
      abzug: Number(a.abzug),
    };
  }

  private mapWiederkehrendeRechnung(r: WiederkehrendeRechnungen) {
    return {
      ...r,
      id: Number(r.id),
      kunden_id: r.kunden_id ? Number(r.kunden_id) : null,
    };
  }
}
