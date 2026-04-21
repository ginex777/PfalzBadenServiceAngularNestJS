import { Test, TestingModule } from '@nestjs/testing';
import { MahnungenController } from './mahnungen.controller';
import { MahnungenService } from './mahnungen.service';

const mockService = {
  findAllGrouped: jest.fn(),
  findByInvoice: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  createPdf: jest.fn(),
};

describe('MahnungenController', () => {
  let controller: MahnungenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MahnungenController],
      providers: [{ provide: MahnungenService, useValue: mockService }],
    }).compile();

    controller = module.get<MahnungenController>(MahnungenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
