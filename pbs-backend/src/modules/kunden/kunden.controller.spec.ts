import { Test, TestingModule } from '@nestjs/testing';
import { KundenController } from './kunden.controller';
import { KundenService } from './kunden.service';
import { of } from 'rxjs';

const mockService = {
  alleKundenLaden: jest.fn(),
  kundeErstellen: jest.fn(),
  kundeAktualisieren: jest.fn(),
  kundeLoeschen: jest.fn(),
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

  describe('alleKundenLaden()', () => {
    it('delegiert an Service', async () => {
      const kunden = { data: [{ id: 1, name: 'Test' }], total: 1, page: 1, limit: 100, totalPages: 1 };
      mockService.alleKundenLaden.mockResolvedValue(kunden);
      const result = await controller.alleKundenLaden({ page: 1, limit: 100 });
      expect(result).toBe(kunden);
    });
  });

  describe('kundeLoeschen()', () => {
    it('delegiert ID und Nutzer an Service', async () => {
      mockService.kundeLoeschen.mockResolvedValue({ ok: true });
      const result = await controller.kundeLoeschen(5, 'Dennis');
      expect(mockService.kundeLoeschen).toHaveBeenCalledWith(5, 'Dennis');
      expect(result).toEqual({ ok: true });
    });
  });
});
