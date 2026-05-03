import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Req,
  Res,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response, CookieOptions } from 'express';
import type { AuthService } from './auth.service';
import type { LoginDto } from './dto/login.dto';
import type { SetupDto } from './dto/setup.dto';
import type { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

const REFRESH_COOKIE = 'refreshToken';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private get refreshCookieOptions(): CookieOptions {
    const maxAge =
      parseInt(process.env['JWT_REFRESH_EXPIRES_IN'] ?? '604800', 10) * 1000;
    return {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge,
    };
  }

  /** First-run setup — only works when 0 users exist */
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('setup')
  setup(@Body() dto: SetupDto) {
    return this.auth.setup(dto);
  }

  /** Check whether first-run setup is still required */
  @Public()
  @Post('setup/status')
  async setupStatus() {
    const required = await this.auth.isFirstRun();
    return { setupRequired: required };
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) ?? req.ip;
    const result = await this.auth.login(dto, ip);
    res.cookie(REFRESH_COOKIE, result.refreshToken, this.refreshCookieOptions);
    return result;
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request & { cookies: Record<string, string> },
    @Body('refreshToken') bodyToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies[REFRESH_COOKIE] ?? bodyToken;
    if (!token) throw new UnauthorizedException('Kein Refresh-Token');
    const result = await this.auth.refresh(token);
    res.cookie(REFRESH_COOKIE, result.refreshToken, this.refreshCookieOptions);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request & { cookies: Record<string, string> },
    @Body('refreshToken') bodyToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies[REFRESH_COOKIE] ?? bodyToken;
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    if (token) return this.auth.logout(token);
    return { message: 'Abgemeldet' };
  }

  @Get('users')
  @UseGuards(RolesGuard)
  @Roles('admin')
  listUsers() {
    return this.auth.listUsers();
  }

  @Post('users')
  @UseGuards(RolesGuard)
  @Roles('admin')
  createUser(
    @Body() body: CreateUserDto,
    @Req() req: Request & { user?: { email: string; fullName?: string } },
  ) {
    const erstelltVon = req.user?.email ?? 'admin';
    const erstelltVonName = req.user?.fullName ?? req.user?.email ?? 'admin';
    return this.auth.createUser(
      body.email,
      body.password,
      body.rolle,
      erstelltVon,
      body.vorname,
      body.nachname,
      erstelltVonName,
    );
  }

  @Delete('users/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user?: { email: string; fullName?: string } },
  ) {
    const geloeschtVon = req.user?.email ?? 'admin';
    const geloeschtVonName = req.user?.fullName ?? req.user?.email ?? 'admin';
    return this.auth.deleteUser(BigInt(id), geloeschtVon, geloeschtVonName);
  }

  @Patch('users/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
    @Req() req: Request & { user?: { email: string; fullName?: string } },
  ) {
    const geaendertVon = req.user?.email ?? 'admin';
    const geaendertVonName = req.user?.fullName ?? req.user?.email ?? 'admin';
    return this.auth.updateUser(
      BigInt(id),
      body,
      geaendertVon,
      geaendertVonName,
    );
  }
}
