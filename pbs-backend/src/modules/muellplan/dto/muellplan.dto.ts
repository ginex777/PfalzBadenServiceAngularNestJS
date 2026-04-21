import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateObjektDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  strasse?: string;

  @IsOptional()
  @IsString()
  plz?: string;

  @IsOptional()
  @IsString()
  ort?: string;

  @IsOptional()
  @IsString()
  notiz?: string;

  @IsOptional()
  @IsString()
  filter_typen?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  vorlage_id?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  kunden_id?: number;
}

export class UpdateObjektDto extends CreateObjektDto {}

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

