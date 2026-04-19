import { Test, TestingModule } from '@nestjs/testing';
import { AngeboteController } from './angebote.controller';
import { AngeboteService } from './angebote.service';

const mockService = {
  alleAngeboteLaden: jest.fn(),
  angebotErstellen: jest.fn(),
  angebotAktualisieren: jest.fn(),
  angebotLoeschen: jest.fn(),
};

describe('AngeboteController', () => {
  let controller: AngeboteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AngeboteController],
      providers: [{ provide: AngeboteService, useValue: mockService }],
    }).compile();

    controller = module.get<AngeboteController>(AngeboteController);
    jest.clearAllMocks();
  });

  it('sollte erstellt werden', () => {
    expect(controller).toBeDefined();
  });

  it('alleAngeboteLaden() delegiert an Service', async () => {
    mockService.alleAngeboteLaden.mockResolvedValue({ data: [], total: 0, page: 1, limit: 100, totalPages: 0 });
    await controller.alleAngeboteLaden({ page: 1, limit: 100 });
    expect(mockService.alleAngeboteLaden).toHaveBeenCalledTimes(1);
  });
});
