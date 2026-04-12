import { Test, TestingModule } from '@nestjs/testing';
import { BelegeService } from './belege.service';
import { PrismaService } from '../../core/database/prisma.service';

const mockPrisma = {};

describe('BelegeService', () => {
  let service: BelegeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BelegeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BelegeService>(BelegeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
