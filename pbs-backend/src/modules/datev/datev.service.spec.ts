import { DatevService } from './datev.service';

describe('DatevService', () => {
  const prisma = {
    buchhaltung: { findMany: jest.fn() },
    settings: { findUnique: jest.fn() },
  };

  let service: DatevService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DatevService(prisma as never);
  });

  it('reports missing company settings and empty bookings as validation errors', async () => {
    prisma.settings.findUnique.mockResolvedValue(null);
    prisma.buchhaltung.findMany.mockResolvedValue([]);

    const result = await service.validate(2026, 4);

    expect(result.ok).toBe(false);
    expect(result.stats.totalRows).toBe(0);
    expect(result.warnings.some((warning) => warning.typ === 'error')).toBe(
      true,
    );
  });

  it('builds DATEV csv export rows from bookings', async () => {
    prisma.settings.findUnique.mockResolvedValue({
      value: JSON.stringify({
        datev_beraternr: '12345',
        datev_mandantennr: '67890',
      }),
    });
    prisma.buchhaltung.findMany.mockResolvedValue([
      {
        id: BigInt(1),
        jahr: 2026,
        monat: 4,
        typ: 'inc',
        name: 'Kunde GmbH',
        datum: new Date('2026-05-08T00:00:00Z'),
        brutto: 119,
        mwst: 19,
        abzug: 100,
        renr: 'R-1',
        belegnr: null,
        kategorie: null,
        beleg_id: null,
      },
    ]);

    const result = await service.buildCsvExport(2026, 4);

    expect(result.filename).toBe('DATEV_Buchungsstapel_2026_Mai.csv');
    expect(result.content).toContain('12345;67890');
    expect(result.content).toContain('119,00;H;EUR');
  });
});
