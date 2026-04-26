import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEmail,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';

export class RechnungPositionDto {
  @ApiProperty() @IsString() @IsNotEmpty() bez!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) stunden?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() einzelpreis?: number;
  @ApiProperty() @IsNumber() gesamtpreis!: number;
}

export class CreateRechnungDto {
  @ApiProperty() @IsString() @IsNotEmpty() nr!: string;
  @ApiProperty() @IsString() @IsNotEmpty() empf!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() str?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ort?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() titel?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() datum?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() leistungsdatum?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  zahlungsziel?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  kunden_id?: number;
  @ApiProperty() @IsNumber() @Min(0) brutto!: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() frist?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() bezahlt?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() bezahlt_am?: string;
  @ApiProperty({ type: [RechnungPositionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RechnungPositionDto)
  positionen!: RechnungPositionDto[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  mwst_satz?: number;
}

export class UpdateRechnungDto extends PartialType(CreateRechnungDto) {}
