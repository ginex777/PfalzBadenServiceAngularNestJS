import { Test, TestingModule } from '@nestjs/testing';
import { RechnungenController } from './rechnungen.controller';
import { RechnungenService } from './rechnungen.service';

const mockService = {
  alleRechnungenLaden: jest.fn(),
  rechnungErstellen: jest.fn(),
  rechnungAktualisieren: jest.fn(),
  rechnungLoeschen: jest.fn(),
};

describe('RechnungenController', () => {
  let controller: RechnungenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RechnungenController],
      providers: [{ provide: RechnungenService, useValue: mockService }],
    }).compile();

    controller = module.get<RechnungenController>(RechnungenController);
    jest.clearAllMocks();
  });

  it('sollte erstellt werden', () => {
    expect(controller).toBeDefined();
  });

  describe('alleRechnungenLaden()', () => {
    it('delegiert an Service und gibt Ergebnis zurück', async () => {
      const rechnungen = [{ id: 1, nr: 'R-001', empf: 'Test', bezahlt: false, brutto: 100 }];
      mockService.alleRechnungenLaden.mockResolvedValue(rechnungen);

      const result = await controller.alleRechnungenLaden();

      expect(result).toBe(rechnungen);
      expect(mockService.alleRechnungenLaden).toHaveBeenCalledTimes(1);
    });
  });

  describe('rechnungErstellen()', () => {
    it('delegiert DTO und Nutzer an Service', async () => {
      const dto = { nr: 'R-001', empf: 'Test', brutto: 100, positionen: [], mwst_satz: 19 } as any;
      const created = { id: 1, ...dto };
      mockService.rechnungErstellen.mockResolvedValue(created);

      const result = await controller.rechnungErstellen(dto, 'Dennis');

      expect(mockService.rechnungErstellen).toHaveBeenCalledWith(dto, 'Dennis');
      expect(result).toBe(created);
    });
  });

  describe('rechnungLoeschen()', () => {
    it('delegiert ID und Nutzer an Service', async () => {
      mockService.rechnungLoeschen.mockResolvedValue({ ok: true });

      const result = await controller.rechnungLoeschen(42, 'Dennis');

      expect(mockService.rechnungLoeschen).toHaveBeenCalledWith(42, 'Dennis');
      expect(result).toEqual({ ok: true });
    });
  });
});
