import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/database/prisma.service';

export interface JwtPayload {
  sub?: string; // legacy user id as string
  userId?: string;
  mitarbeiterId?: number | null;
  email: string;
  rolle: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET environment variable is not set');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const userId = payload.userId ?? payload.sub;
    if (!userId) throw new UnauthorizedException();

    const user = await this.prisma.users.findUnique({
      where: { id: BigInt(userId) },
      select: {
        id: true,
        email: true,
        rolle: true,
        aktiv: true,
        vorname: true,
        nachname: true,
      },
    });
    if (!user || !user.aktiv) throw new UnauthorizedException();
    return {
      id: user.id,
      email: user.email,
      rolle: user.rolle,
      mitarbeiterId: payload.mitarbeiterId ?? null,
      vorname: user.vorname,
      nachname: user.nachname,
      fullName:
        user.vorname && user.nachname
          ? `${user.vorname} ${user.nachname}`
          : user.vorname || user.nachname || user.email,
    };
  }
}
