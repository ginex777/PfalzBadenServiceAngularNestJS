import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ChecklistSubmissionListQueryDto,
  ChecklistTemplateListQueryDto,
  CreateChecklistSubmissionDto,
  CreateChecklistTemplateDto,
  UpdateChecklistTemplateDto,
} from './dto/checklisten.dto';
import { ChecklistenService } from './checklisten.service';

type AuthRequest = Request & {
  user?: { email: string; rolle: string; fullName?: string; mitarbeiterId?: number | null };
};

@Controller('api/checklisten')
export class ChecklistenController {
  constructor(private readonly service: ChecklistenService) {}

  // Templates (Admin edits; others read)
  @Get('templates')
  @Roles('admin', 'readonly')
  templatesList(@Query() query: ChecklistTemplateListQueryDto) {
    return this.service.templatesList({
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
    });
  }

  @Get('templates/all')
  @Roles('admin', 'readonly', 'mitarbeiter')
  templatesAll() {
    return this.service.templatesAllActive();
  }

  @Get('templates/:id')
  @Roles('admin', 'readonly', 'mitarbeiter')
  templateGet(@Param('id', ParseIntPipe) id: number) {
    return this.service.templateGet(id);
  }

  @Post('templates')
  @Roles('admin')
  templateCreate(@Body() dto: CreateChecklistTemplateDto) {
    return this.service.templateCreate(dto);
  }

  @Put('templates/:id')
  @Roles('admin')
  templateUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChecklistTemplateDto,
  ) {
    return this.service.templateUpdate(id, dto);
  }

  // Submissions
  @Get('submissions')
  @Roles('admin', 'readonly', 'mitarbeiter')
  submissionsList(@Query() query: ChecklistSubmissionListQueryDto, @Req() req: AuthRequest) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.submissionsList(query, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }

  @Get('submissions/:id')
  @Roles('admin', 'readonly', 'mitarbeiter')
  submissionGet(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.submissionGet(id, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
    });
  }

  @Post('submissions')
  @Roles('admin', 'mitarbeiter')
  submissionCreate(@Body() dto: CreateChecklistSubmissionDto, @Req() req: AuthRequest) {
    const user = req.user;
    if (!user) throw new BadRequestException('Missing auth context');
    return this.service.submissionCreate(dto, {
      role: user.rolle,
      employeeId: user.mitarbeiterId ?? null,
      user: {
        email: user.email,
        fullName: user.fullName ?? user.email,
      },
    });
  }
}

