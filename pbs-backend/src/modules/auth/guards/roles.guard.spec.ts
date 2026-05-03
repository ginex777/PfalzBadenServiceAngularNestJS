import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

function contextWithRole(role: string | undefined): ExecutionContext {
  const request = { user: role ? { rolle: role } : undefined };
  return {
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: <T = typeof request>() => request as T,
      getResponse: jest.fn(),
      getNext: jest.fn(),
    }),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  };
}

describe('RolesGuard', () => {
  it('allows routes without required roles', () => {
    const reflector = { getAllAndOverride: jest.fn(() => undefined) };
    const guard = new RolesGuard(reflector as never);

    expect(guard.canActivate(contextWithRole(undefined))).toBe(true);
  });

  it('allows users with a required role', () => {
    const reflector = { getAllAndOverride: jest.fn(() => ['admin']) };
    const guard = new RolesGuard(reflector as never);

    expect(guard.canActivate(contextWithRole('admin'))).toBe(true);
  });

  it('blocks users without a required role', () => {
    const reflector = { getAllAndOverride: jest.fn(() => ['admin']) };
    const guard = new RolesGuard(reflector as never);

    expect(() => guard.canActivate(contextWithRole('readonly'))).toThrow(
      ForbiddenException,
    );
  });
});
