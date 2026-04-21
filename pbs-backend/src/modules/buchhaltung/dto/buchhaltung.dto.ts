import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  IsIn,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BuchhaltungEintragDto {
  @ApiProperty({ enum: ['inc', 'exp'] }) @IsIn(['inc', 'exp']) typ!:
    | 'inc'
    | 'exp';
  @ApiProperty() @IsInt() @Min(2000) @Max(2100) jahr!: number;
  @ApiProperty() @IsInt() @Min(0) @Max(11) monat!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() datum?: string;
  @ApiProperty() @IsNumber() @Min(0) brutto!: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  mwst?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  abzug?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() kategorie?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() renr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() belegnr?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() beleg_id?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() id?: number;
}

export class BatchSpeichernDto {
  @ApiProperty() @IsInt() @Min(2000) @Max(2100) jahr!: number;
  @ApiProperty() @IsInt() @Min(0) @Max(11) monat!: number;
  @ApiProperty({ type: [BuchhaltungEintragDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BuchhaltungEintragDto)
  rows!: BuchhaltungEintragDto[];
}

export class VstDto {
  @ApiProperty() @IsInt() @Min(2000) @Max(2100) jahr!: number;
  @ApiProperty() @IsString() quartal!: string;
  @ApiPropertyOptional() @IsOptional() paid?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() datum?: string;
}

export class MonatSperrenDto {
  @ApiProperty() @IsInt() @Min(2000) @Max(2100) jahr!: number;
  @ApiProperty() @IsInt() @Min(0) @Max(11) monat!: number;
}
