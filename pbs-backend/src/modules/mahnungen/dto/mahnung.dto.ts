import { IsInt, IsPositive, IsDateString, IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMahnungDto {
  @ApiProperty() @IsInt() @IsPositive() rechnung_id!: number;
  @ApiProperty() @IsInt() @Min(1) stufe!: number;
  @ApiProperty() @IsDateString() datum!: string;
  @ApiProperty() @IsNumber() @Min(0) betrag_gebuehr!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notiz?: string;
}
