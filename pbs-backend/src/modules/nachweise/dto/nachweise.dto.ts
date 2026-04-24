import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class UploadEvidenceDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  objectId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class EvidenceListQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  objectId?: number;
}

