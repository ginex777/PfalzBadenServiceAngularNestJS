import { HausmeisterService } from './hausmeister.service';
import { Test, TestingModule } from '@nestjs/testing';
import { HausmeisterController } from './hausmeister.controller';

describe('HausmeisterController', () => {
  let controller: HausmeisterController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HausmeisterController],
      providers: [
        {
          provide: HausmeisterService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<HausmeisterController>(HausmeisterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
