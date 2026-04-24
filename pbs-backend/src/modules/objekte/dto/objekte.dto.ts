import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ObjektStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListObjekteQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(
    ({ value, obj }) => value ?? obj.kundeId ?? obj.kundenId ?? obj.kunden_id,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId?: number;
}

export class CreateObjektDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @Transform(({ value, obj }) => value ?? obj.strasse)
  @IsString()
  street?: string;

  @IsOptional()
  @Transform(({ value, obj }) => value ?? obj.hausnummer)
  @IsString()
  houseNumber?: string;

  @IsOptional()
  @Transform(({ value, obj }) => value ?? obj.plz)
  @IsString()
  postalCode?: string;

  @IsOptional()
  @Transform(({ value, obj }) => value ?? obj.ort)
  @IsString()
  city?: string;

  @IsOptional()
  @Transform(({ value, obj }) => value ?? obj.notiz)
  @IsString()
  note?: string;

  @IsOptional()
  @Transform(({ value, obj }) => value ?? obj.filter_typen)
  @IsString()
  filterTypes?: string;

  @IsOptional()
  @Transform(({ value, obj }) => value ?? obj.vorlage_id)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  templateId?: number;

  @Transform(
    ({ value, obj }) => value ?? obj.kundeId ?? obj.kundenId ?? obj.kunden_id,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId!: number;

  @IsOptional()
  @IsEnum(ObjektStatus)
  status?: ObjektStatus;
}

export class UpdateObjektDto extends CreateObjektDto {}
