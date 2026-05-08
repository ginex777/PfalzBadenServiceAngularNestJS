import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { DatevController } from './datev.controller';
import { DatevService } from './datev.service';

const mockDatevService = {};

describe('DatevController', () => {
  let controller: DatevController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatevController],
      providers: [{ provide: DatevService, useValue: mockDatevService }],
    }).compile();

    controller = module.get<DatevController>(DatevController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
