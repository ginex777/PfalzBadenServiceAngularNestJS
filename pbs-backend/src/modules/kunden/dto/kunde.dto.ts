import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKundeDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) name!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  strasse?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) ort?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) tel?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notiz?: string;
}

export class UpdateKundeDto extends CreateKundeDto {}
