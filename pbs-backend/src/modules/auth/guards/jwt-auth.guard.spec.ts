import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const parentCanActivate = jest.fn(
  (_context: ExecutionContext): unknown => 'parent-result',
);

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () =>
    class {
      canActivate(context: ExecutionContext) {
        return parentCanActivate(context);
      }
    },
}));

import { JwtAuthGuard } from './jwt-auth.guard';

function context(): ExecutionContext {
  return {
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  };
}

describe('JwtAuthGuard', () => {
  beforeEach(() => {
    parentCanActivate.mockClear();
  });

  it('allows public routes without invoking passport', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const guard = new JwtAuthGuard(reflector);

    expect(guard.canActivate(context())).toBe(true);
    expect(parentCanActivate).not.toHaveBeenCalled();
  });

  it('delegates protected routes to passport jwt guard', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const guard = new JwtAuthGuard(reflector);

    expect(guard.canActivate(context())).toBe('parent-result');
    expect(parentCanActivate).toHaveBeenCalledTimes(1);
  });
});
