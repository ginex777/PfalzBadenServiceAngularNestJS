import { Test, TestingModule } from '@nestjs/testing';
import { MuellplanService } from './muellplan.service';
import { PrismaService } from '../../core/database/prisma.service';

const mockPrisma = {};

describe('MuellplanService', () => {
  let service: MuellplanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MuellplanService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MuellplanService>(MuellplanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
