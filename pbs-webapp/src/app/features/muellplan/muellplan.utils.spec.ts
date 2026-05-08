import { parseVorlageText } from './muellplan.utils';

describe('parseVorlageText', () => {
  it('parses month-prefixed garbage schedule rows and sorts by date', () => {
    const result = parseVorlageText(
      ['Februar: Restmüll 2, Biotonne 8', 'Januar: Papier 15, Gelber Sack 7'].join('\n'),
      2026,
    );

    expect(result.map((entry) => entry.datum)).toEqual([
      '2026-01-07',
      '2026-01-15',
      '2026-02-02',
      '2026-02-08',
    ]);
    expect(result.map((entry) => entry.muellart)).toEqual([
      'Gelber Sack',
      'Papier',
      'Restmüll',
      'Bioabfall',
    ]);
  });

  it('parses type-header schedules and removes duplicate dates per garbage type', () => {
    const result = parseVorlageText(
      ['Biotonne', 'Jan: 8. 8. 22.', 'Restmüll', 'März: 3. 17.'].join('\n'),
      2026,
    );

    expect(result).toEqual([
      expect.objectContaining({ datum: '2026-01-08', muellart: 'Bioabfall' }),
      expect.objectContaining({ datum: '2026-01-22', muellart: 'Bioabfall' }),
      expect.objectContaining({ datum: '2026-03-03', muellart: 'Restmüll' }),
      expect.objectContaining({ datum: '2026-03-17', muellart: 'Restmüll' }),
    ]);
  });

  it('ignores invalid days, unknown garbage types, and empty lines', () => {
    const result = parseVorlageText(
      ['Unbekannt: 1 2', '', 'Mai: Biotonne 0 12 32', 'Papier', 'Foo: 9'].join('\n'),
      2026,
    );

    expect(result).toEqual([
      expect.objectContaining({ datum: '2026-05-12', muellart: 'Bioabfall' }),
    ]);
  });
});
