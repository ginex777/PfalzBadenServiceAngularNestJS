import { MuellplanService } from './muellplan.service';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { MuellplanController } from './muellplan.controller';

describe('MuellplanController', () => {
  let controller: MuellplanController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MuellplanController],
      providers: [
        {
          provide: MuellplanService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MuellplanController>(MuellplanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
