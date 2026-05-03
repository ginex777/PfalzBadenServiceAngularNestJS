import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { UserRole } from '../decorators/roles.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!required.includes(user?.rolle)) {
      throw new ForbiddenException('Keine Berechtigung für diese Aktion');
    }
    return true;
  }
}
