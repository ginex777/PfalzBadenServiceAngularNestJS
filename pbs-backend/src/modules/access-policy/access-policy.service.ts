import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';

export type AccessPolicyAuth = {
  role: string;
  employeeId: number | null;
};

@Injectable()
export class AccessPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanAccessEmployee(
    auth: AccessPolicyAuth,
    employeeId: number,
  ): Promise<void> {
    if (auth.role === 'admin') return;
    if (auth.role !== 'mitarbeiter') {
      throw new ForbiddenException('Forbidden');
    }
    this.requireEmployeeMapping(auth);
    if (auth.employeeId !== employeeId) {
      throw new ForbiddenException('Forbidden');
    }
  }

  async assertCanAccessObject(
    auth: AccessPolicyAuth,
    objectId: number,
  ): Promise<void> {
    if (this.canAccessAllObjects(auth)) return;
    this.requireEmployeeMapping(auth);
    const count = await this.prisma.tasks.count({
      where: {
        object_id: BigInt(objectId),
        employee_id: BigInt(auth.employeeId),
      },
    });
    if (count === 0) {
      throw new ForbiddenException('Forbidden');
    }
  }

  objectWhereForAuth(
    auth: AccessPolicyAuth,
    customerId?: number,
  ): Prisma.ObjekteWhereInput | undefined {
    const whereParts: Prisma.ObjekteWhereInput[] = [];
    if (typeof customerId === 'number') {
      whereParts.push({ kunden_id: BigInt(customerId) });
    }
    if (!this.canAccessAllObjects(auth)) {
      this.requireEmployeeMapping(auth);
      whereParts.push({
        tasks: { some: { employee_id: BigInt(auth.employeeId) } },
      });
    }
    return whereParts.length > 0 ? { AND: whereParts } : undefined;
  }

  async accessibleObjectIds(auth: AccessPolicyAuth): Promise<bigint[] | null> {
    if (this.canAccessAllObjects(auth)) return null;
    this.requireEmployeeMapping(auth);
    const rows = await this.prisma.tasks.findMany({
      where: { employee_id: BigInt(auth.employeeId) },
      distinct: ['object_id'],
      select: { object_id: true },
    });
    return rows.map((row) => row.object_id);
  }

  canAccessAllObjects(auth: AccessPolicyAuth): boolean {
    return auth.role === 'admin' || auth.role === 'readonly';
  }

  requireEmployeeMapping(auth: AccessPolicyAuth): asserts auth is {
    role: string;
    employeeId: number;
  } {
    if (auth.employeeId == null) {
      throw new BadRequestException({
        code: 'MISSING_EMPLOYEE_MAPPING',
        message:
          'Kein Mitarbeiter-Mapping vorhanden. Bitte Admin kontaktieren (User <-> Mitarbeiter zuordnen).',
      });
    }
  }
}
