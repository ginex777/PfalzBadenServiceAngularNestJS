import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { SetupDto } from './dto/setup.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  /** Returns true if no users exist yet (first-run) */
  async istErsteinrichtung(): Promise<boolean> {
    const count = await this.prisma.users.count();
    return count === 0;
  }

  /** Create the first admin user (only allowed when no users exist) */
  async ersteinrichtung(dto: SetupDto) {
    const exists = await this.prisma.users.count();
    if (exists > 0) {
      throw new ConflictException('Ersteinrichtung bereits abgeschlossen');
    }
    const hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.users.create({
      data: { email: dto.email.toLowerCase(), password_hash: hash, rolle: 'admin' },
    });
    await this.audit.protokollieren('users', user.id, 'CREATE', null, { email: user.email, rolle: user.rolle }, 'system');
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

    const tokens = await this._issueTokens(user.id, user.email, user.rolle);

    await this.audit.protokollieren(
      'users', user.id, 'UPDATE',
      null,
      { aktion: 'login', ip: ip ?? 'unbekannt' },
      user.email,
    );

    return { ...tokens, rolle: user.rolle, email: user.email };
  }

  async refresh(tokenHash: string) {
    const stored = await this.prisma.refreshTokens.findUnique({
      where: { token_hash: tokenHash },
    });
    if (!stored || stored.expires_at < new Date()) {
      throw new UnauthorizedException('Session abgelaufen');
    }
    const user = await this.prisma.users.findUnique({ where: { id: stored.user_id } });
    if (!user || !user.aktiv) throw new UnauthorizedException();

    // Rotate: delete old, issue new
    await this.prisma.refreshTokens.delete({ where: { token_hash: tokenHash } });
    return this._issueTokens(user.id, user.email, user.rolle);
  }

  async logout(refreshTokenHash: string) {
    await this.prisma.refreshTokens.deleteMany({ where: { token_hash: refreshTokenHash } });
    return { message: 'Abgemeldet' };
  }

  private async _issueTokens(userId: bigint, email: string, rolle: string) {
    const payload = { sub: userId.toString(), email, rolle };
    const accessToken = this.jwt.sign(payload);

    const refreshSecret = this.config.get<string>('JWT_SECRET') ?? 'pbs-dev-secret';
    const refreshRaw = this.jwt.sign(payload, {
      secret: refreshSecret + '-refresh',
      expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as `${number}d`,
    });

    const hash = await bcrypt.hash(refreshRaw, 10);
    const expiresIn = parseInt(this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '604800');
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await this.prisma.refreshTokens.create({
      data: { user_id: userId, token_hash: hash, expires_at: expiresAt },
    });

    return { accessToken, refreshToken: refreshRaw };
  }

  async userAnlegen(email: string, password: string, rolle: 'admin' | 'readonly' | 'mitarbeiter', erstelltVon: string) {
    const exists = await this.prisma.users.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) throw new ConflictException('E-Mail bereits vergeben');
    if (password.length < 8) throw new BadRequestException('Passwort zu kurz (min. 8 Zeichen)');
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.prisma.users.create({
      data: { email: email.toLowerCase(), password_hash: hash, rolle },
    });
    await this.audit.protokollieren('users', user.id, 'CREATE', null, { email: user.email, rolle }, erstelltVon);
    return { id: user.id.toString(), email: user.email, rolle: user.rolle };
  }
}
