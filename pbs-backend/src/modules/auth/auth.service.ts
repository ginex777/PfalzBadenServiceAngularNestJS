import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';
import type { LoginDto } from './dto/login.dto';
import type { SetupDto } from './dto/setup.dto';
import type { UpdateUserDto, UserRole } from './dto/users.dto';

const BCRYPT_ROUNDS = 12;
const MISSING_EMPLOYEE_MAPPING_CODE = 'MISSING_EMPLOYEE_MAPPING';
const MAX_SESSIONS_PER_USER = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  /** Returns true if no users exist yet (first-run) */
  async isFirstRun(): Promise<boolean> {
    const count = await this.prisma.users.count();
    return count === 0;
  }

  /** Create the first admin user (only allowed when no users exist) */
  async setup(dto: SetupDto) {
    const exists = await this.prisma.users.count();
    if (exists > 0) {
      throw new ConflictException('Ersteinrichtung bereits abgeschlossen');
    }
    const hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.users.create({
      data: {
        email: dto.email.toLowerCase(),
        password_hash: hash,
        rolle: 'admin',
      },
    });
    await this.audit.log(
      'users',
      user.id,
      'CREATE',
      null,
      { email: user.email, rolle: user.rolle },
      'system',
    );
    return { message: 'Admin-Account erstellt' };
  }

  async login(dto: LoginDto, ip?: string) {
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.aktiv) {
      throw new UnauthorizedException('Ungültige Anmeldedaten');
    }
    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Ungültige Anmeldedaten');
    }

    const mitarbeiterId = await this._resolveMitarbeiterId(user.id, user.email);
    this.ensureEmployeeMapping(user.rolle, mitarbeiterId, user.email);
    const tokens = await this._issueTokens(
      user.id,
      user.email,
      user.rolle,
      mitarbeiterId,
    );

    // Session cap: delete oldest tokens beyond limit
    const allTokens = await this.prisma.refreshTokens.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'asc' },
      select: { id: true },
    });
    if (allTokens.length > MAX_SESSIONS_PER_USER) {
      const toDelete = allTokens.slice(0, allTokens.length - MAX_SESSIONS_PER_USER);
      await this.prisma.refreshTokens.deleteMany({
        where: { id: { in: toDelete.map((t) => t.id) } },
      });
    }

    await this.audit.log(
      'users',
      user.id,
      'UPDATE',
      null,
      { aktion: 'login', ip: ip ?? 'unbekannt' },
      user.email,
      user.vorname && user.nachname
        ? `${user.vorname} ${user.nachname}`
        : user.email,
    );

    return {
      ...tokens,
      rolle: user.rolle,
      email: user.email,
      vorname: user.vorname,
      nachname: user.nachname,
      mitarbeiterId,
    };
  }

  async refresh(tokenHash: string) {
    const { token: stored, userId, familyId } = await this.findStoredRefreshToken(tokenHash);

    if (!stored) {
      // Reuse detection: JWT verified but token not in DB
      if (userId !== null && familyId !== null) {
        const familyTokens = await this.prisma.refreshTokens.findMany({
          where: { user_id: userId, family_id: familyId },
          select: { id: true },
        });
        if (familyTokens.length > 0) {
          await this.prisma.refreshTokens.deleteMany({
            where: { user_id: userId, family_id: familyId },
          });
          this.logger.warn(
            `Refresh token reuse detected for user ${userId.toString()} family ${familyId} — session invalidated`,
          );
          await this.audit.log(
            'users',
            userId,
            'UPDATE',
            null,
            { aktion: 'token_reuse_detected', family_id: familyId },
            'system',
          );
        }
      }
      throw new UnauthorizedException('Session abgelaufen');
    }

    if (stored.expires_at < new Date()) {
      throw new UnauthorizedException('Session abgelaufen');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: stored.user_id },
    });
    if (!user || !user.aktiv) throw new UnauthorizedException();

    // Rotate: delete old, issue new with SAME family_id
    await this.prisma.refreshTokens.delete({
      where: { id: stored.id },
    });
    const mitarbeiterId = await this._resolveMitarbeiterId(user.id, user.email);
    this.ensureEmployeeMapping(user.rolle, mitarbeiterId, user.email);
    return this._issueTokens(user.id, user.email, user.rolle, mitarbeiterId, stored.family_id);
  }

  async logout(refreshTokenHash: string) {
    const { token: stored } = await this.findStoredRefreshToken(refreshTokenHash);
    if (stored) {
      await this.prisma.refreshTokens.delete({
        where: { id: stored.id },
      });
    }
    return { message: 'Abgemeldet' };
  }

  private async _issueTokens(
    userId: bigint,
    email: string,
    rolle: string,
    mitarbeiterId: number | null,
    familyId?: string,
  ) {
    const payload = {
      sub: userId.toString(), // legacy compatibility
      userId: userId.toString(),
      mitarbeiterId,
      email,
      rolle,
    };
    const accessToken = this.jwt.sign(payload);

    const refreshSecret = this.config.getOrThrow<string>('JWT_SECRET');
    const refreshExpiresInSec = parseInt(
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '604800',
      10,
    );

    const resolvedFamilyId = familyId ?? randomUUID();
    const refreshPayload = { ...payload, familyId: resolvedFamilyId };
    const refreshRaw = this.jwt.sign(refreshPayload, {
      secret: `${refreshSecret}-refresh`,
      expiresIn: refreshExpiresInSec,
    });

    const hash = await bcrypt.hash(refreshRaw, 10);
    const expiresAt = new Date(Date.now() + refreshExpiresInSec * 1000);

    await this.prisma.refreshTokens.create({
      data: { user_id: userId, token_hash: hash, expires_at: expiresAt, family_id: resolvedFamilyId },
    });

    return { accessToken, refreshToken: refreshRaw };
  }

  private async _resolveMitarbeiterId(
    userId: bigint,
    email: string,
  ): Promise<number | null> {
    try {
      const linked = await this.prisma.mitarbeiter.findUnique({
        where: { user_id: userId },
        select: { id: true },
      });
      if (linked) return Number(linked.id);

      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) return null;

      const match = await this.prisma.mitarbeiter.findFirst({
        where: {
          user_id: null,
          email: { equals: normalizedEmail, mode: 'insensitive' },
        },
        orderBy: { id: 'asc' },
        select: { id: true },
      });
      if (!match) return null;

      const updated = await this.prisma.mitarbeiter.update({
        where: { id: match.id },
        data: { user_id: userId },
        select: { id: true },
      });
      return Number(updated.id);
    } catch (error) {
      this.logger.warn(
        `Mitarbeiter link resolution skipped for user ${userId.toString()}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return null;
    }
  }

  private ensureEmployeeMapping(
    role: string,
    employeeId: number | null,
    email: string,
  ): void {
    if (role !== 'mitarbeiter' || employeeId != null) return;
    this.logger.warn(
      `Blocked login due to missing mitarbeiter mapping for user ${email}`,
    );
    throw new ForbiddenException({
      code: MISSING_EMPLOYEE_MAPPING_CODE,
      message:
        'Kein Mitarbeiterprofil zugeordnet. Bitte den Administrator kontaktieren.',
    });
  }

  private async findStoredRefreshToken(rawToken: string): Promise<{
    token: { id: bigint; user_id: bigint; token_hash: string; expires_at: Date; family_id: string } | null;
    userId: bigint | null;
    familyId: string | null;
  }> {
    const refreshSecret = `${this.config.getOrThrow<string>('JWT_SECRET')}-refresh`;
    let payloadUserId: string | null = null;
    let payloadFamilyId: string | null = null;

    try {
      const payload = this.jwt.verify<{ userId?: string; sub?: string; familyId?: string }>(
        rawToken,
        {
          secret: refreshSecret,
        },
      );
      payloadUserId = payload.userId ?? payload.sub ?? null;
      payloadFamilyId = payload.familyId ?? null;
    } catch {
      return { token: null, userId: null, familyId: null };
    }

    if (!payloadUserId) return { token: null, userId: null, familyId: null };

    const userId = BigInt(payloadUserId);
    const candidates = await this.prisma.refreshTokens.findMany({
      where: { user_id: userId },
      select: { id: true, user_id: true, token_hash: true, expires_at: true, family_id: true },
    });

    for (const candidate of candidates) {
      if (await bcrypt.compare(rawToken, candidate.token_hash)) {
        return { token: candidate, userId, familyId: candidate.family_id };
      }
    }

    return { token: null, userId, familyId: payloadFamilyId };
  }

  async listUsers() {
    const users = await this.prisma.users.findMany({
      select: {
        id: true,
        email: true,
        rolle: true,
        aktiv: true,
        vorname: true,
        nachname: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });
    return users.map((u) => ({ ...u, id: u.id.toString() }));
  }

  async createUser(
    email: string,
    password: string,
    rolle: UserRole,
    erstelltVon: string,
    vorname?: string,
    nachname?: string,
    erstelltVonName?: string,
  ) {
    const exists = await this.prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (exists) throw new ConflictException('E-Mail bereits vergeben');
    if (password.length < 8)
      throw new BadRequestException('Passwort zu kurz (min. 8 Zeichen)');
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.prisma.users.create({
      data: {
        email: email.toLowerCase(),
        password_hash: hash,
        rolle,
        vorname: vorname ?? null,
        nachname: nachname ?? null,
      },
    });
    await this.audit.log(
      'users',
      user.id,
      'CREATE',
      null,
      { email: user.email, rolle },
      erstelltVon,
      erstelltVonName,
    );
    return {
      id: user.id.toString(),
      email: user.email,
      rolle: user.rolle,
      vorname: user.vorname,
      nachname: user.nachname,
    };
  }

  async deleteUser(
    id: bigint,
    geloeschtVon: string,
    geloeschtVonName?: string,
  ) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('Benutzer nicht gefunden');
    // Prevent deleting the last admin
    if (user.rolle === 'admin') {
      const adminCount = await this.prisma.users.count({
        where: { rolle: 'admin', aktiv: true },
      });
      if (adminCount <= 1)
        throw new BadRequestException(
          'Der letzte Admin kann nicht gelöscht werden',
        );
    }
    await this.prisma.refreshTokens.deleteMany({ where: { user_id: id } });
    await this.prisma.users.delete({ where: { id } });
    await this.audit.log(
      'users',
      id,
      'DELETE',
      { email: user.email, rolle: user.rolle },
      null,
      geloeschtVon,
      geloeschtVonName,
    );
    return { message: 'Benutzer gelöscht' };
  }

  async updateUser(
    id: bigint,
    daten: UpdateUserDto,
    geaendertVon: string,
    geaendertVonName?: string,
  ) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('Benutzer nicht gefunden');
    if (user.rolle === 'admin' && daten.rolle && daten.rolle !== 'admin') {
      const adminCount = await this.prisma.users.count({
        where: { rolle: 'admin', aktiv: true },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Der letzte Admin kann nicht herabgestuft werden',
        );
      }
    }
    const updated = await this.prisma.users.update({
      where: { id },
      data: {
        vorname: daten.vorname,
        nachname: daten.nachname,
        rolle: daten.rolle,
      },
    });
    await this.audit.log(
      'users',
      id,
      'UPDATE',
      { vorname: user.vorname, nachname: user.nachname, rolle: user.rolle },
      daten,
      geaendertVon,
      geaendertVonName,
    );
    return {
      id: updated.id.toString(),
      email: updated.email,
      rolle: updated.rolle,
      vorname: updated.vorname,
      nachname: updated.nachname,
      aktiv: updated.aktiv,
      created_at: updated.created_at,
    };
  }
}
