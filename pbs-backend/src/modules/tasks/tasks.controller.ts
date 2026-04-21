import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CreateTaskDto,
  ReorderTasksDto,
  UpdateTaskDto,
} from './dto/task.dto';

@Controller('api/tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}
  @Get() alleTasksLaden(@Query() pagination: PaginationDto) {
    return this.service.alleTasksLaden(pagination);
  }
  @Post('reorder') tasksNeuAnordnen(@Body() b: ReorderTasksDto) {
    return this.service.tasksNeuAnordnen(b.updates);
  }
  @Post() taskErstellen(@Body() b: CreateTaskDto) {
    return this.service.taskErstellen(b);
  }
  @Put(':id') taskAktualisieren(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: UpdateTaskDto,
  ) {
    return this.service.taskAktualisieren(id, b);
  }
  @Delete(':id') taskLoeschen(@Param('id', ParseIntPipe) id: number) {
    return this.service.taskLoeschen(id);
  }
}
