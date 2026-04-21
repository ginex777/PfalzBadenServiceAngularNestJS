import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Req,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SetupDto } from './dto/setup.dto';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** First-run setup — only works when 0 users exist */
  @Public()
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
    @Body()
    body: {
      email: string;
      password: string;
      rolle: 'admin' | 'readonly' | 'mitarbeiter';
      vorname?: string;
      nachname?: string;
    },
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
    @Body() body: { vorname?: string; nachname?: string; rolle?: string },
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
