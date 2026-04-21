import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/decorators/public.decorator';

@Controller('api')
export class HealthController {
  @Public()
  @Get('health')
  health() {
    return { ok: true, timestamp: new Date().toISOString() };
  }
}
