import { Test, TestingModule } from '@nestjs/testing';
import { MuellplanService } from './muellplan.service';
import { PrismaService } from '../../core/database/prisma.service';
import { TasksService } from '../tasks/tasks.service';

const mockPrisma = {};

describe('MuellplanService', () => {
  let service: MuellplanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MuellplanService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TasksService, useValue: {} },
      ],
    }).compile();

    service = module.get<MuellplanService>(MuellplanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
