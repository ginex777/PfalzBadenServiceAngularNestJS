import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { RechnungPositionDto } from '../../rechnungen/dto/rechnung.dto';

export class CreateAngebotDto {
  @ApiProperty() @IsString() @IsNotEmpty() nr!: string;
  @ApiProperty() @IsString() @IsNotEmpty() empf!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() str?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ort?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() titel?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() datum?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) brutto?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() gueltig_bis?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() angenommen?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() abgelehnt?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() gesendet?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() zusatz?: string;
  @ApiProperty({ type: [RechnungPositionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RechnungPositionDto)
  positionen!: RechnungPositionDto[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  kunden_id?: number;
}

export class UpdateAngebotDto extends PartialType(CreateAngebotDto) {}
