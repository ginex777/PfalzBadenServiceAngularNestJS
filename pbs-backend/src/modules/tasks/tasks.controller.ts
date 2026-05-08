import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import type {
  CreateTaskDto,
  TaskListQueryDto,
  UpdateTaskDto,
} from './dto/tasks.dto';
import { TasksService } from './tasks.service';

@ApiTags('Aufgaben')
@ApiSecurity('x-nutzer')
@Roles('admin', 'readonly')
@Controller('api/aufgaben')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Aufgaben laden (mit Filtern)' })
  list(@Query() query: TaskListQueryDto) {
    return this.service.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Manuelle Aufgabe anlegen' })
  @Roles('admin')
  create(@Body() dto: CreateTaskDto) {
    return this.service.createManual(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Aufgabe aktualisieren' })
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.service.update(id, dto);
  }
}
