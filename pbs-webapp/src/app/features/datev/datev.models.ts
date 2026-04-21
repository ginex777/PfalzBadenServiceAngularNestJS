export type DatevZeitraumTyp = 'year' | 'q1' | 'q2' | 'q3' | 'q4' | 'month';

export type {
  DatevValidierungsMeldung,
  DatevVorschauZeile,
  DatevVorschauAntwort,
} from '../../core/api/api.service';

export const QUARTAL_MONATE: Record<string, number[]> = {
  q1: [0, 1, 2],
  q2: [3, 4, 5],
  q3: [6, 7, 8],
  q4: [9, 10, 11],
};

export const QUARTAL_LABELS: Record<string, string> = {
  q1: 'Q1 (Jan–Mrz)',
  q2: 'Q2 (Apr–Jun)',
  q3: 'Q3 (Jul–Sep)',
  q4: 'Q4 (Okt–Dez)',
};
