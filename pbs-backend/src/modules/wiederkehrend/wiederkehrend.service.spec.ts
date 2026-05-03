import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { WiederkehrendService } from './wiederkehrend.service';
import { PrismaService } from '../../core/database/prisma.service';

const mockPrisma = {};

describe('WiederkehrendService', () => {
  let service: WiederkehrendService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WiederkehrendService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WiederkehrendService>(WiederkehrendService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
