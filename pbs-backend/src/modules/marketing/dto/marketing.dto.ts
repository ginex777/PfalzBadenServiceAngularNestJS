import { IsDateString, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const MARKETING_STATUS = [
  'neu',
  'gesendet',
  'interesse',
  'kein-interesse',
  'angebot',
] as const;

export class CreateMarketingKontaktDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  person?: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  tel?: string;

  @IsOptional()
  @IsString()
  strasse?: string;

  @IsOptional()
  @IsString()
  ort?: string;

  @IsOptional()
  @IsString()
  notiz?: string;

  @IsOptional()
  @IsIn(MARKETING_STATUS)
  status?: string;

  @IsOptional()
  @IsString()
  status_notiz?: string;

  @IsOptional()
  @IsDateString()
  datum?: string;
}

export class UpdateMarketingKontaktDto extends CreateMarketingKontaktDto {}

