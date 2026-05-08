import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_READONLY_WRITE_KEY } from '../decorators/allow-readonly-write.decorator';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class ReadonlyWriteBlockGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      method?: string;
      user?: { rolle?: string } | null;
    }>();

    const method = (req.method ?? '').toUpperCase();
    if (SAFE_METHODS.has(method)) return true;

    const role = req.user?.rolle;
    if (role !== 'readonly') return true;

    const allow = this.reflector.getAllAndOverride<boolean>(
      ALLOW_READONLY_WRITE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allow) return true;

    throw new ForbiddenException(
      'Readonly: Schreibaktionen sind nicht erlaubt',
    );
  }
}
