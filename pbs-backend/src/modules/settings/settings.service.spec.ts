import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../../core/database/prisma.service';

const mockPrisma = {};

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
