import { Test, TestingModule } from '@nestjs/testing';
import { MitarbeiterService } from './mitarbeiter.service';
import { PrismaService } from '../../core/database/prisma.service';

const mockPrisma = {};

describe('MitarbeiterService', () => {
  let service: MitarbeiterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MitarbeiterService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MitarbeiterService>(MitarbeiterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
