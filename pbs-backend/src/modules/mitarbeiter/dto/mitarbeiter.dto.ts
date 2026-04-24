import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMitarbeiterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  rolle?: string;

  @IsNumber()
  @Min(0)
  stundenlohn!: number;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  tel?: string;

  @IsOptional()
  @IsString()
  notiz?: string;

  @IsOptional()
  @IsBoolean()
  aktiv?: boolean;
}

export class UpdateMitarbeiterDto extends CreateMitarbeiterDto {}

export class CreateMitarbeiterStundenDto {
  @IsDateString()
  datum!: string;

  @IsNumber()
  @Min(0)
  stunden!: number;

  @IsOptional()
  @IsString()
  beschreibung?: string;

  @IsOptional()
  @IsString()
  ort?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lohn?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  zuschlag?: number;

  @IsOptional()
  @IsString()
  zuschlag_typ?: string;

  @IsOptional()
  @IsBoolean()
  bezahlt?: boolean;
}

export class UpdateMitarbeiterStundenDto extends CreateMitarbeiterStundenDto {}

export class StempelStartDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  objektId?: number;

  @IsOptional()
  @IsString()
  notiz?: string;
}
