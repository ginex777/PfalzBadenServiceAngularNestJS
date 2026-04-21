import { Test, TestingModule } from '@nestjs/testing';
import { RechnungenController } from './rechnungen.controller';
import { RechnungenService } from './rechnungen.service';
import { CreateRechnungDto } from './dto/rechnung.dto';

const mockService = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
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

  describe('findAll()', () => {
    it('delegiert an Service und gibt Ergebnis zurück', async () => {
      const rechnungen = {
        data: [
          { id: 1, nr: 'R-001', empf: 'Test', bezahlt: false, brutto: 100 },
        ],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      };
      mockService.findAll.mockResolvedValue(rechnungen);

      const result = await controller.findAll({ page: 1, limit: 100 });

      expect(result).toBe(rechnungen);
      expect(mockService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('create()', () => {
    it('delegiert DTO und Nutzer an Service', async () => {
      const dto: CreateRechnungDto = {
        nr: 'R-001',
        empf: 'Test',
        brutto: 100,
        positionen: [],
        mwst_satz: 19,
      };
      const created = { id: 1, ...dto };
      mockService.create.mockResolvedValue(created);

      const result = await controller.create(dto, 'Dennis');

      expect(mockService.create).toHaveBeenCalledWith(dto, 'Dennis');
      expect(result).toBe(created);
    });
  });

  describe('delete()', () => {
    it('delegiert ID und Nutzer an Service', async () => {
      mockService.delete.mockResolvedValue({ ok: true });

      const result = await controller.delete(42, 'Dennis');

      expect(mockService.delete).toHaveBeenCalledWith(42, 'Dennis');
      expect(result).toEqual({ ok: true });
    });
  });
});
