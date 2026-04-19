import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('kpis')
  kpis() {
    return this.service.kpis();
  }

  @Get('activity')
  activity() {
    return this.service.activity();
  }

  @Get('revenue-trend')
  revenueTrend(
    @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
  ) {
    return this.service.revenueTrend(Math.min(months, 24));
  }
}
