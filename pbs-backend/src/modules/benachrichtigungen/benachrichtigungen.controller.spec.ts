import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { BenachrichtigungenController } from './benachrichtigungen.controller';
import { BenachrichtigungenService } from './benachrichtigungen.service';

const mockBenachrichtigungenService = {};

describe('BenachrichtigungenController', () => {
  let controller: BenachrichtigungenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BenachrichtigungenController],
      providers: [
        {
          provide: BenachrichtigungenService,
          useValue: mockBenachrichtigungenService,
        },
      ],
    }).compile();

    controller = module.get<BenachrichtigungenController>(
      BenachrichtigungenController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
