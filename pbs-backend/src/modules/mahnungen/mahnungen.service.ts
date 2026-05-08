import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { Prisma } from '@prisma/client';
import type { CreateMahnungDto } from './dto/mahnung.dto';

@Injectable()
export class MahnungenService {
  private readonly logger = new Logger(MahnungenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
  ) {}

  async findAllGrouped(): Promise<Record<number, number>> {
    const rows = await this.prisma.mahnungen.groupBy({
      by: ['rechnung_id'],
      _count: { id: true },
    });
    const map: Record<number, number> = {};
    rows.forEach((r) => {
      map[Number(r.rechnung_id)] = r._count.id;
    });
    return map;
  }

  async findByInvoice(rechnungId: number) {
    const rows = await this.prisma.mahnungen.findMany({
      where: { rechnung_id: BigInt(rechnungId) },
      orderBy: { stufe: 'asc' },
    });
    return rows.map((m) => ({
      ...m,
      id: Number(m.id),
      rechnung_id: Number(m.rechnung_id),
      betrag_gebuehr: Number(m.betrag_gebuehr),
    }));
  }

  async create(dto: CreateMahnungDto) {
    const m = await this.prisma.mahnungen.create({
      data: {
        rechnung: { connect: { id: BigInt(dto.rechnung_id) } },
        stufe: dto.stufe,
        datum: new Date(dto.datum),
        betrag_gebuehr: new Prisma.Decimal(dto.betrag_gebuehr),
        notiz: dto.notiz ?? null,
      },
    });
    return {
      ...m,
      id: Number(m.id),
      rechnung_id: Number(m.rechnung_id),
      betrag_gebuehr: Number(m.betrag_gebuehr),
    };
  }

  async delete(id: number) {
    await this.prisma.mahnungen.delete({ where: { id: BigInt(id) } });
    return { ok: true };
  }

  async createPdf(id: number) {
    return this.pdfService.createMahnungPdf(id);
  }
}
