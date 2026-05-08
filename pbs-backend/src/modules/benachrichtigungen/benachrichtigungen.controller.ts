import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { BenachrichtigungenService } from './benachrichtigungen.service';

@Roles('admin', 'mitarbeiter', 'readonly')
@Controller('api/benachrichtigungen')
export class BenachrichtigungenController {
  constructor(
    private readonly benachrichtigungenService: BenachrichtigungenService,
  ) {}

  @Get()
  async findAll() {
    return this.benachrichtigungenService.findUnread();
  }

  @Post('alle-lesen')
  async markAllRead() {
    return this.benachrichtigungenService.markAllRead();
  }

  @Post(':id/lesen')
  async markRead(@Param('id', ParseIntPipe) id: number) {
    return this.benachrichtigungenService.markRead(id);
  }
}
