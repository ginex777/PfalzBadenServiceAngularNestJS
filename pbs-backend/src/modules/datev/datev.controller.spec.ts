import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { DatevController } from './datev.controller';
import { PrismaService } from '../../core/database/prisma.service';

const mockPrisma = {};

describe('DatevController', () => {
  let controller: DatevController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatevController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<DatevController>(DatevController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
