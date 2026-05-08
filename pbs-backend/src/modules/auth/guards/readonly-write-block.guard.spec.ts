import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ReadonlyWriteBlockGuard } from './readonly-write-block.guard';

function context(method: string, role?: string): ExecutionContext {
  const request = { method, user: role ? { rolle: role } : undefined };
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

describe('ReadonlyWriteBlockGuard', () => {
  it('allows safe methods for readonly users', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const guard = new ReadonlyWriteBlockGuard(reflector);

    expect(guard.canActivate(context('GET', 'readonly'))).toBe(true);
  });

  it('allows writes for non-readonly users', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const guard = new ReadonlyWriteBlockGuard(reflector);

    expect(guard.canActivate(context('POST', 'admin'))).toBe(true);
  });

  it('allows explicitly permitted readonly writes', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const guard = new ReadonlyWriteBlockGuard(reflector);

    expect(guard.canActivate(context('POST', 'readonly'))).toBe(true);
  });

  it('blocks readonly writes by default', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const guard = new ReadonlyWriteBlockGuard(reflector);

    expect(() => guard.canActivate(context('DELETE', 'readonly'))).toThrow(
      ForbiddenException,
    );
  });
});
