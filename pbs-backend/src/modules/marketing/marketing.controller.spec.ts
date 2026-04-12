import { MarketingService } from './marketing.service';
import { Test, TestingModule } from '@nestjs/testing';
import { MarketingController } from './marketing.controller';

describe('MarketingController', () => {
  let controller: MarketingController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketingController],
      providers: [
        {
          provide: MarketingService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MarketingController>(MarketingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
