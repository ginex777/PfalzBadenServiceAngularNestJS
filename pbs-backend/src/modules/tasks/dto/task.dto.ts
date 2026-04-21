import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

const TASK_STATUS = ['todo', 'in_progress', 'done'] as const;
const TASK_PRIORITAET = ['niedrig', 'mittel', 'hoch'] as const;

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  titel!: string;

  @IsOptional()
  @IsString()
  beschreibung?: string;

  @IsOptional()
  @IsDateString()
  datum?: string;

  @IsOptional()
  @IsString()
  bearbeiter?: string;

  @IsOptional()
  @IsString()
  kategorie?: string;

  @IsOptional()
  @IsIn(TASK_STATUS)
  status?: string;

  @IsOptional()
  @IsIn(TASK_PRIORITAET)
  prioritaet?: string;
}

export class UpdateTaskDto extends CreateTaskDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class TaskReorderUpdateDto {
  @IsInt()
  @Min(1)
  id!: number;

  @IsIn(TASK_STATUS)
  status!: string;

  @IsInt()
  @Min(0)
  position!: number;
}

export class ReorderTasksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskReorderUpdateDto)
  updates!: TaskReorderUpdateDto[];
}

