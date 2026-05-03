import {
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../audit/audit.service';

type AuthPrismaMock = {
  users: {
    findUnique: jest.Mock;
    count: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
  };
  mitarbeiter: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  refreshTokens: {
    create: jest.Mock;
    findMany: jest.Mock;
    delete: jest.Mock;
    deleteMany: jest.Mock;
  };
};

function createPrismaMock(): AuthPrismaMock {
  return {
    users: {
      findUnique: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    mitarbeiter: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    refreshTokens: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
}

function createJwtMock() {
  return {
    sign: jest.fn((_payload: unknown, options?: { secret?: string }) =>
      options?.secret ? 'refresh-token' : 'access-token',
    ),
    verify: jest.fn((): Record<string, string> => ({ userId: '1' })),
  };
}

function user(
  overrides: Partial<{
    id: bigint;
    email: string;
    password_hash: string;
    rolle: string;
    aktiv: boolean;
    vorname: string | null;
    nachname: string | null;
  }> = {},
) {
  return {
    id: 1n,
    email: 'admin@example.com',
    password_hash: 'hash',
    rolle: 'admin',
    aktiv: true,
    vorname: null,
    nachname: null,
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: AuthPrismaMock;
  let jwt: ReturnType<typeof createJwtMock>;
  const audit = { log: jest.fn() };
  const config = {
    get: jest.fn((key: string) =>
      key === 'JWT_REFRESH_EXPIRES_IN' ? '3600' : undefined,
    ),
    getOrThrow: jest.fn(() => 'test-secret'),
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    jwt = createJwtMock();
    audit.log.mockResolvedValue(undefined);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('logs in active users and issues rotated token storage', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    prisma.users.findUnique.mockResolvedValue(
      user({ password_hash: passwordHash }),
    );
    prisma.mitarbeiter.findUnique.mockResolvedValue(null);
    prisma.mitarbeiter.findFirst.mockResolvedValue(null);
    prisma.refreshTokens.create.mockResolvedValue({});
    prisma.refreshTokens.findMany.mockResolvedValue([{ id: 1n }]); // under cap

    const result = await service.login({
      email: 'ADMIN@EXAMPLE.COM',
      password: 'correct-password',
    });

    expect(result).toEqual(
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        email: 'admin@example.com',
        rolle: 'admin',
      }),
    );
    expect(prisma.users.findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@example.com' },
    });
    expect(prisma.refreshTokens.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ user_id: 1n }),
      }),
    );
    expect(audit.log).toHaveBeenCalled();
  });

  it('rejects inactive users before password validation', async () => {
    prisma.users.findUnique.mockResolvedValue(user({ aktiv: false }));

    await expect(
      service.login({ email: 'admin@example.com', password: 'anything' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects invalid login passwords', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    prisma.users.findUnique.mockResolvedValue(
      user({ password_hash: passwordHash }),
    );

    await expect(
      service.login({ email: 'admin@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(prisma.refreshTokens.create).not.toHaveBeenCalled();
  });

  it('rejects mitarbeiter login without an employee mapping', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    prisma.users.findUnique.mockResolvedValue(
      user({
        password_hash: passwordHash,
        rolle: 'mitarbeiter',
        email: 'worker@example.com',
      }),
    );
    prisma.mitarbeiter.findUnique.mockResolvedValue(null);
    prisma.mitarbeiter.findFirst.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'worker@example.com',
        password: 'correct-password',
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.refreshTokens.create).not.toHaveBeenCalled();
  });

  it('rotates refresh tokens and deletes the old token', async () => {
    const tokenHash = await bcrypt.hash('raw-refresh-token', 4);
    jwt.verify.mockReturnValue({ userId: '1', familyId: 'test-family-uuid' });
    prisma.refreshTokens.findMany.mockResolvedValue([
      {
        id: 9n,
        user_id: 1n,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 60_000),
        family_id: 'test-family-uuid',
      },
    ]);
    prisma.users.findUnique.mockResolvedValue(user());
    prisma.mitarbeiter.findUnique.mockResolvedValue(null);
    prisma.mitarbeiter.findFirst.mockResolvedValue(null);
    prisma.refreshTokens.delete.mockResolvedValue({});
    prisma.refreshTokens.create.mockResolvedValue({});

    await expect(service.refresh('raw-refresh-token')).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(prisma.refreshTokens.delete).toHaveBeenCalledWith({
      where: { id: 9n },
    });
  });

  it('rejects reused refresh tokens after rotation', async () => {
    jwt.verify.mockReturnValue({ userId: '1', familyId: 'test-family-uuid' });
    // hash lookup returns nothing, family check also returns nothing
    prisma.refreshTokens.findMany
      .mockResolvedValueOnce([]) // hash lookup
      .mockResolvedValueOnce([]); // family check

    await expect(service.refresh('raw-refresh-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects expired refresh tokens', async () => {
    const tokenHash = await bcrypt.hash('raw-refresh-token', 4);
    jwt.verify.mockReturnValue({ userId: '1', familyId: 'test-family-uuid' });
    prisma.refreshTokens.findMany.mockResolvedValue([
      {
        id: 9n,
        user_id: 1n,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() - 60_000),
        family_id: 'test-family-uuid',
      },
    ]);

    await expect(service.refresh('raw-refresh-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('logs out by deleting a matching stored refresh token', async () => {
    const tokenHash = await bcrypt.hash('raw-refresh-token', 4);
    jwt.verify.mockReturnValue({ userId: '1', familyId: 'test-family-uuid' });
    prisma.refreshTokens.findMany.mockResolvedValue([
      {
        id: 9n,
        user_id: 1n,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 60_000),
        family_id: 'test-family-uuid',
      },
    ]);
    prisma.refreshTokens.delete.mockResolvedValue({});

    await expect(service.logout('raw-refresh-token')).resolves.toEqual({
      message: 'Abgemeldet',
    });
    expect(prisma.refreshTokens.delete).toHaveBeenCalledWith({
      where: { id: 9n },
    });
  });

  it('prevents deleting the last active admin', async () => {
    prisma.users.findUnique.mockResolvedValue(user({ rolle: 'admin' }));
    prisma.users.count.mockResolvedValue(1);

    await expect(service.deleteUser(1n, 'admin@example.com')).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.users.delete).not.toHaveBeenCalled();
  });

  it('prevents demoting the last active admin', async () => {
    prisma.users.findUnique.mockResolvedValue(user({ rolle: 'admin' }));
    prisma.users.count.mockResolvedValue(1);

    await expect(
      service.updateUser(1n, { rolle: 'readonly' }, 'admin@example.com'),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.users.update).not.toHaveBeenCalled();
  });

  it('detects token reuse and invalidates the entire family', async () => {
    jwt.verify.mockReturnValue({ userId: '1', familyId: 'test-family' });
    prisma.refreshTokens.findMany
      .mockResolvedValueOnce([]) // hash lookup finds nothing
      .mockResolvedValueOnce([{ id: 9n }]); // family check finds orphaned record
    prisma.refreshTokens.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.refresh('raw-refresh-token')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prisma.refreshTokens.deleteMany).toHaveBeenCalledWith({
      where: { user_id: 1n, family_id: 'test-family' },
    });
    expect(audit.log).toHaveBeenCalledWith(
      'users',
      1n,
      'UPDATE',
      null,
      expect.objectContaining({ aktion: 'token_reuse_detected', family_id: 'test-family' }),
      'system',
    );
  });

  it('enforces session cap and deletes oldest tokens on login', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    prisma.users.findUnique.mockResolvedValue(
      user({ password_hash: passwordHash }),
    );
    prisma.mitarbeiter.findUnique.mockResolvedValue(null);
    prisma.mitarbeiter.findFirst.mockResolvedValue(null);
    prisma.refreshTokens.create.mockResolvedValue({});
    // 6 tokens after create — oldest first
    prisma.refreshTokens.findMany.mockResolvedValue([
      { id: 1n },
      { id: 2n },
      { id: 3n },
      { id: 4n },
      { id: 5n },
      { id: 6n },
    ]);
    prisma.refreshTokens.deleteMany.mockResolvedValue({ count: 1 });

    await service.login({ email: 'admin@example.com', password: 'correct-password' });

    expect(prisma.refreshTokens.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [1n] } },
    });
  });
});
