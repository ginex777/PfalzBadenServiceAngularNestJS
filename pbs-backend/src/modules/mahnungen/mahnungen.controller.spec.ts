import { Test, TestingModule } from '@nestjs/testing';
import { MahnungenController } from './mahnungen.controller';
import { PrismaService } from '../../core/database/prisma.service';

const mockPrisma = {};

describe('MahnungenController', () => {
  let controller: MahnungenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MahnungenController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<MahnungenController>(MahnungenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
