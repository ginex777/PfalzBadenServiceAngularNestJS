import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { KundenController } from './kunden.controller';
import { KundenService } from './kunden.service';

const mockService = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('KundenController', () => {
  let controller: KundenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KundenController],
      providers: [{ provide: KundenService, useValue: mockService }],
    }).compile();

    controller = module.get<KundenController>(KundenController);
    jest.clearAllMocks();
  });

  it('sollte erstellt werden', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll()', () => {
    it('delegiert an Service', async () => {
      const kunden = {
        data: [{ id: 1, name: 'Test' }],
        total: 1,
        page: 1,
        pageSize: 100,
      };
      mockService.findAll.mockResolvedValue(kunden);
      const result = await controller.findAll({ page: 1, pageSize: 100 });
      expect(result).toBe(kunden);
    });
  });

  describe('delete()', () => {
    it('delegiert ID und Nutzer an Service', async () => {
      mockService.delete.mockResolvedValue({ ok: true });
      const result = await controller.delete(5, 'Dennis');
      expect(mockService.delete).toHaveBeenCalledWith(5, 'Dennis');
      expect(result).toEqual({ ok: true });
    });
  });
});
