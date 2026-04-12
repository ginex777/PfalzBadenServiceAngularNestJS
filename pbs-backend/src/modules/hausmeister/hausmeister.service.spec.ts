import { Test, TestingModule } from '@nestjs/testing';
import { HausmeisterService } from './hausmeister.service';
import { PrismaService } from '../../core/database/prisma.service';

const mockPrisma = {};

describe('HausmeisterService', () => {
  let service: HausmeisterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HausmeisterService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HausmeisterService>(HausmeisterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
