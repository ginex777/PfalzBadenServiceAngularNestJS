import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { VertraegeService } from './vertraege.service';

const baseContract = {
  id: 4n,
  kunden_id: 2n,
  kunden_name: 'Kunde GmbH',
  kunden_strasse: null,
  kunden_ort: null,
  vorlage: 'Dienstleistungsvertrag',
  titel: 'Winterdienst',
  vertragsbeginn: new Date('2026-01-01T00:00:00.000Z'),
  laufzeit_monate: 12,
  monatliche_rate: new Prisma.Decimal(100),
  leistungsumfang: null,
  kuendigungsfrist: 3,
  status: 'aktiv',
  pdf_filename: null,
  html_body: '<p>internal</p>',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  updated_at: new Date('2026-01-01T00:00:00.000Z'),
};

describe('VertraegeService', () => {
  const prisma = {
    vertraege: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const audit = { log: jest.fn() };

  let service: VertraegeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VertraegeService(prisma as never, audit as never);
  });

  it('creates contracts with defaults, maps totals, and audits the change', async () => {
    prisma.vertraege.create.mockResolvedValue(baseContract);

    const result = await service.create(
      {
        kunden_id: 2,
        kunden_name: 'Kunde GmbH',
        titel: 'Winterdienst',
        vertragsbeginn: '2026-01-01',
        monatliche_rate: 100,
      },
      'admin@example.test',
    );

    expect(prisma.vertraege.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          kunden_id: 2n,
          laufzeit_monate: 12,
          status: 'aktiv',
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({ id: 4, gesamtwert: 1200 }),
    );
    expect(result.html_body).toBeUndefined();
    expect(audit.log).toHaveBeenCalledWith(
      'vertraege',
      4n,
      'CREATE',
      null,
      result,
      'admin@example.test',
    );
  });

  it('updates existing contracts and writes before/after audit data', async () => {
    const updated = {
      ...baseContract,
      titel: 'Winterdienst Plus',
      laufzeit_monate: 24,
      monatliche_rate: new Prisma.Decimal(150),
    };
    prisma.vertraege.findUnique.mockResolvedValue(baseContract);
    prisma.vertraege.update.mockResolvedValue(updated);

    const result = await service.update(
      4,
      { titel: 'Winterdienst Plus', laufzeit_monate: 24, monatliche_rate: 150 },
      'admin@example.test',
    );

    expect(prisma.vertraege.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 4n },
        data: expect.objectContaining({
          titel: 'Winterdienst Plus',
          laufzeit_monate: 24,
        }),
      }),
    );
    expect(result.gesamtwert).toBe(3600);
    expect(audit.log).toHaveBeenCalledWith(
      'vertraege',
      4n,
      'UPDATE',
      expect.objectContaining({ titel: 'Winterdienst' }),
      expect.objectContaining({ titel: 'Winterdienst Plus' }),
      'admin@example.test',
    );
  });

  it('deletes existing contracts and audits the removal', async () => {
    prisma.vertraege.findUnique.mockResolvedValue(baseContract);
    prisma.vertraege.delete.mockResolvedValue(baseContract);

    await expect(service.delete(4, 'admin@example.test')).resolves.toEqual({
      ok: true,
    });

    expect(prisma.vertraege.delete).toHaveBeenCalledWith({ where: { id: 4n } });
    expect(audit.log).toHaveBeenCalledWith(
      'vertraege',
      4n,
      'DELETE',
      expect.objectContaining({ id: 4 }),
      null,
      'admin@example.test',
    );
  });

  it('throws when updating a missing contract', async () => {
    prisma.vertraege.findUnique.mockResolvedValue(null);

    await expect(service.update(404, { titel: 'x' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
