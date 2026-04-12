import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { PrismaService } from '../../core/database/prisma.service';

describe('AuditController', () => {
  let controller: AuditController;

  const mockPrisma = {
    auditLog: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
