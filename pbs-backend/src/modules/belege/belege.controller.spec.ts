import { BelegeService } from './belege.service';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { BelegeController } from './belege.controller';

describe('BelegeController', () => {
  let controller: BelegeController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BelegeController],
      providers: [
        {
          provide: BelegeService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<BelegeController>(BelegeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
