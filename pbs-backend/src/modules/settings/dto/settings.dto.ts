import { IsDefined, IsObject } from 'class-validator';

export class SaveSettingsDto {
  @IsDefined()
  @IsObject()
  value!: Record<string, unknown>;
}

