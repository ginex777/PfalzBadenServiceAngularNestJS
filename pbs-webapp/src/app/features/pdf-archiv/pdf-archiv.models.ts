export type PdfArchivFilter =
  | 'alle'
  | 'rechnung'
  | 'angebot'
  | 'euer'
  | 'muellplan'
  | 'hausmeister';

export const PDF_TYP_LABELS: Record<string, string> = {
  rechnung: 'Rechnung',
  angebot: 'Angebot',
  euer: 'EÜR',
  muellplan: 'Müllplan',
  hausmeister: 'Hausmeister',
};
