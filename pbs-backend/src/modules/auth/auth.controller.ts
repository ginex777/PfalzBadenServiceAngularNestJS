import {
  Controller, Post, Body, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SetupDto } from './dto/setup.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** First-run setup — only works when 0 users exist */
  @Public()
  @Post('setup')
  setup(@Body() dto: SetupDto) {
    return this.auth.ersteinrichtung(dto);
  }

  /** Check whether first-run setup is still required */
  @Public()
  @Post('setup/status')
  async setupStatus() {
    const required = await this.auth.istErsteinrichtung();
    return { setupRequired: required };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) ?? req.ip;
    return this.auth.login(dto, ip);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body('refreshToken') token: string) {
    return this.auth.refresh(token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body('refreshToken') token: string) {
    return this.auth.logout(token);
  }
}
