import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}
  @Get(':key') einstellungenLaden(@Param('key') key: string) { return this.service.einstellungenLaden(key); }
  @Post(':key') einstellungenSpeichern(@Param('key') key: string, @Body() body: unknown) { return this.service.einstellungenSpeichern(key, body); }
}
