import { Test, TestingModule } from '@nestjs/testing';
import { BenachrichtigungenController } from './benachrichtigungen.controller';
import { PrismaService } from '../../core/database/prisma.service';

const mockPrisma = {};

describe('BenachrichtigungenController', () => {
  let controller: BenachrichtigungenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BenachrichtigungenController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<BenachrichtigungenController>(BenachrichtigungenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
