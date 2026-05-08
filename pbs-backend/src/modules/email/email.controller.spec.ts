import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';

const mockEmailService = {};

describe('EmailController', () => {
  let controller: EmailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [{ provide: EmailService, useValue: mockEmailService }],
    }).compile();

    controller = module.get<EmailController>(EmailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
