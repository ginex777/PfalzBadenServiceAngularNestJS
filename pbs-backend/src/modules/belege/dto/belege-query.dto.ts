import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class BelegeQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(9999)
  jahr?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['beleg', 'rechnung', 'quittung', 'sonstiges'])
  typ?: string;
}
