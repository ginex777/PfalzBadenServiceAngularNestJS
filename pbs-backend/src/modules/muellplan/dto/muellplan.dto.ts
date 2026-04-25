import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateMuellplanTerminDto {
  @IsNumber()
  @Min(1)
  objekt_id!: number;

  @IsString()
  @IsNotEmpty()
  muellart!: string;

  @IsOptional()
  @IsString()
  farbe?: string;

  @IsDateString()
  abholung!: string;

  @IsOptional()
  @IsBoolean()
  erledigt?: boolean;

  @IsOptional()
  @IsString()
  beschreibung?: string;

  @IsOptional()
  @IsBoolean()
  aktiv?: boolean;

  @IsOptional()
  @IsNumber()
  user_id?: number;
}

export class UpdateMuellplanTerminDto {
  @IsString()
  @IsNotEmpty()
  muellart!: string;

  @IsOptional()
  @IsString()
  farbe?: string;

  @IsDateString()
  abholung!: string;

  @IsOptional()
  @IsBoolean()
  erledigt?: boolean;

  @IsOptional()
  @IsString()
  beschreibung?: string;

  @IsOptional()
  @IsBoolean()
  aktiv?: boolean;

  @IsOptional()
  @IsNumber()
  user_id?: number;
}

export class ErledigunDto {
  @IsOptional()
  @IsString()
  kommentar?: string;

  @IsOptional()
  @IsString()
  foto_url?: string;
}

export class CopyMuellplanTermineDto {
  @IsNumber()
  @Min(1)
  from_objekt_id!: number;

  @IsNumber()
  @Min(1)
  to_objekt_id!: number;
}

export class MuellplanVorlagenTerminDto {
  @IsString()
  @IsNotEmpty()
  muellart!: string;

  @IsOptional()
  @IsString()
  farbe?: string;

  @IsDateString()
  abholung!: string;
}

export class CreateMuellplanVorlageDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MuellplanVorlagenTerminDto)
  termine?: MuellplanVorlagenTerminDto[];
}

export class ConfirmMuellplanPdfDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MuellplanVorlagenTerminDto)
  termine!: MuellplanVorlagenTerminDto[];
}
