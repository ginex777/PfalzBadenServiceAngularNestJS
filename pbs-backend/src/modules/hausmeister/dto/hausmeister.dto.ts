import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateHausmeisterEinsatzDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  mitarbeiter_id?: number;

  @IsString()
  @IsNotEmpty()
  mitarbeiter_name!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  kunden_id?: number;

  @IsOptional()
  @IsString()
  kunden_name?: string;

  @IsDateString()
  datum!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taetigkeiten?: string[];

  @IsNumber()
  @Min(0)
  stunden_gesamt!: number;

  @IsOptional()
  @IsString()
  notiz?: string;

  @IsOptional()
  @IsBoolean()
  abgeschlossen?: boolean;
}

export class UpdateHausmeisterEinsatzDto extends CreateHausmeisterEinsatzDto {}
