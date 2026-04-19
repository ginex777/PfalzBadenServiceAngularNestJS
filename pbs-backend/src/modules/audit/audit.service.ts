import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(
    table: string,
    recordId: bigint | number,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValue?: unknown,
    newValue?: unknown,
    user?: string,
    userName?: string,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tabelle: table,
        datensatz_id: BigInt(recordId),
        aktion: action,
        alt_wert: oldValue ? (oldValue as object) : undefined,
        neu_wert: newValue ? (newValue as object) : undefined,
        nutzer: user ?? null,
        nutzer_name: userName ?? null,
      },
    });
  }
}
