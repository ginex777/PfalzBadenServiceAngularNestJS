import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateWiederkehrendeAusgabeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  kategorie?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  brutto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  mwst?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  abzug?: number;

  @IsOptional()
  @IsString()
  belegnr?: string;

  @IsOptional()
  @IsBoolean()
  aktiv?: boolean;
}

export class UpdateWiederkehrendeAusgabeDto extends CreateWiederkehrendeAusgabeDto {}

export class WiederkehrendeRechnungPositionDto {
  @IsString()
  @IsNotEmpty()
  bez!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stunden?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  einzelpreis?: number;

  @IsNumber()
  @Min(0)
  gesamtpreis!: number;
}

export class CreateWiederkehrendeRechnungDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  kunden_id?: number;

  @IsOptional()
  @IsString()
  kunden_name?: string;

  @IsString()
  @IsNotEmpty()
  titel!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WiederkehrendeRechnungPositionDto)
  positionen!: WiederkehrendeRechnungPositionDto[];

  @IsOptional()
  @IsString()
  intervall?: string;

  @IsOptional()
  @IsBoolean()
  aktiv?: boolean;
}

export class UpdateWiederkehrendeRechnungDto extends CreateWiederkehrendeRechnungDto {
  @IsOptional()
  @IsDateString()
  letzte_erstellung?: string;
}
