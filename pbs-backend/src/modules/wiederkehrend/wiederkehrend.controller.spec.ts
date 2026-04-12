import { WiederkehrendService } from './wiederkehrend.service';
import { Test, TestingModule } from '@nestjs/testing';
import { WiederkehrendController } from './wiederkehrend.controller';

describe('WiederkehrendController', () => {
  let controller: WiederkehrendController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WiederkehrendController],
      providers: [
        {
          provide: WiederkehrendService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<WiederkehrendController>(WiederkehrendController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
