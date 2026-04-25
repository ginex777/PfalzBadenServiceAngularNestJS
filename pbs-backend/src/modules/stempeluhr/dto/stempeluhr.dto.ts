import { IsOptional, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class ListStempeluhrQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  mitarbeiterId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  objektId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  kundenId?: number;

  @IsOptional()
  @IsDateString()
  von?: string;

  @IsOptional()
  @IsDateString()
  bis?: string;
}

export class StempelEintragDto {
  id: number;
  mitarbeiterId: number;
  mitarbeiterName: string;
  objektId: number | null;
  objektName: string | null;
  kundeId: number | null;
  kundeName: string | null;
  start: string;
  stop: string | null;
  dauerMinuten: number | null;
  notiz: string | null;
}

export class StempeluhrListResponseDto {
  data: StempelEintragDto[];
  total: number;
  totalDurationMinutes: number;
}
