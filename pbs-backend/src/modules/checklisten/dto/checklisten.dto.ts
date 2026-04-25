import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

const CHECKLIST_FIELD_TYPES = [
  'boolean',
  'text',
  'number',
  'select',
  'foto',
  'kommentar',
] as const;
export type ChecklistFieldType = (typeof CHECKLIST_FIELD_TYPES)[number];

export class ChecklistFieldDto {
  @IsString()
  @MaxLength(80)
  fieldId!: string;

  @IsString()
  @MaxLength(200)
  label!: string;

  @IsIn(CHECKLIST_FIELD_TYPES)
  type!: ChecklistFieldType;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  helperText?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  options?: string[];
}

export class CreateChecklistTemplateDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  kategorie?: string;

  @IsArray()
  @ArrayMaxSize(80)
  @ValidateNested({ each: true })
  @Type(() => ChecklistFieldDto)
  fields!: ChecklistFieldDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateChecklistTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  kategorie?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(80)
  @ValidateNested({ each: true })
  @Type(() => ChecklistFieldDto)
  fields?: ChecklistFieldDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignTemplateObjekteDto {
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  objektIds!: number[];
}

export class ChecklistTemplateListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}

export class ChecklistAnswerDto {
  @IsString()
  @MaxLength(80)
  fieldId!: string;

  // Value is validated against the template field type in the backend service.
  @IsOptional()
  value?: unknown;
}

export class CreateChecklistSubmissionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  templateId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  objectId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsArray()
  @ArrayMaxSize(120)
  @ValidateNested({ each: true })
  @Type(() => ChecklistAnswerDto)
  answers!: ChecklistAnswerDto[];
}

export class ChecklistSubmissionListQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  objectId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  templateId?: number;
}
