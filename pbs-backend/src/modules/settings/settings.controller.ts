import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SaveSettingsDto } from './dto/settings.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin')
@Controller('api/settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}
  @Get(':key') einstellungenLaden(@Param('key') key: string) {
    return this.service.einstellungenLaden(key);
  }
  @Post(':key') einstellungenSpeichern(
    @Param('key') key: string,
    @Body() body: SaveSettingsDto,
  ) {
    return this.service.einstellungenSpeichern(key, body.value);
  }
}
