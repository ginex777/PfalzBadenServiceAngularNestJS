import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async protokollieren(
    tabelle: string,
    datensatzId: bigint | number,
    aktion: 'CREATE' | 'UPDATE' | 'DELETE',
    altWert?: unknown,
    neuWert?: unknown,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tabelle,
        datensatz_id: BigInt(datensatzId),
        aktion,
        alt_wert: altWert ? (altWert as object) : undefined,
        neu_wert: neuWert ? (neuWert as object) : undefined,
      },
    });
  }
}
