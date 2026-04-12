import { MitarbeiterService } from './mitarbeiter.service';
import { Test, TestingModule } from '@nestjs/testing';
import { MitarbeiterController } from './mitarbeiter.controller';

describe('MitarbeiterController', () => {
  let controller: MitarbeiterController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MitarbeiterController],
      providers: [
        {
          provide: MitarbeiterService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MitarbeiterController>(MitarbeiterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
