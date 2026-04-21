import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  IsDateString,
  Min,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVertragDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  kunden_id?: number;
  @ApiProperty() @IsString() @IsNotEmpty() kunden_name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() kunden_strasse?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() kunden_ort?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vorlage?: string;
  @ApiProperty() @IsString() @IsNotEmpty() titel!: string;
  @ApiProperty() @IsDateString() vertragsbeginn!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  laufzeit_monate?: number;
  @ApiProperty() @IsNumber() @Min(0) monatliche_rate!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() leistungsumfang?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  kuendigungsfrist?: number;
}

export class UpdateVertragDto {
  @ApiPropertyOptional() @IsOptional() @IsString() kunden_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() kunden_strasse?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() kunden_ort?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vorlage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() titel?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() vertragsbeginn?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  laufzeit_monate?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  monatliche_rate?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() leistungsumfang?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  kuendigungsfrist?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['aktiv', 'gekuendigt', 'abgelaufen', 'pausiert'])
  status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pdf_filename?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() html_body?: string;
}
