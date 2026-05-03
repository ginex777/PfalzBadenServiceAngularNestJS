import { BuchhaltungService } from './buchhaltung.service';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { BuchhaltungController } from './buchhaltung.controller';

describe('BuchhaltungController', () => {
  let controller: BuchhaltungController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BuchhaltungController],
      providers: [
        {
          provide: BuchhaltungService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<BuchhaltungController>(BuchhaltungController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
