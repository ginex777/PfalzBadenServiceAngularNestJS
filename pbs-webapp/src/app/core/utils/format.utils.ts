// ============================================================
// PBS — Format- und Berechnungs-Hilfsfunktionen
// ============================================================

export const MONATE: string[] = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export const KATEGORIEN: Record<string, number> = {
  'Betriebsausgabe': 100,
  'Bewirtung': 70,
  'Reisekosten': 100,
  'Büromaterial': 100,
  'Software/IT': 100,
  'Webhosting/Domain': 100,
  'Miete/Büro': 100,
  'Telefon/Internet': 100,
  'Bankgebühren/Konto': 100,
  'Versicherung': 100,
  'Fortbildung': 100,
  'Werbung/Marketing': 100,
  'Geschenk ≤50€': 100,
  'Geschenk >50€': 0,
  'PKW (betrieblich)': 100,
  'PKW (gemischt 50%)': 50,
  'Repräsentation': 0,
  'Privat (nicht abzugsf.)': 0,
  'Lohn/Gehalt': 100,
  'Sonstiges': 100,
};

/**
 * Formatiert einen Betrag als deutsche Währungsangabe.
 * Beispiel: 1234.5 → "1.234,50 €"
 */
export function waehrungFormatieren(betrag: number): string {
  return (betrag || 0).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €';
}

/**
 * Formatiert ein Datum als deutsches Datumsformat (timezone-sicher).
 * Unterstützt ISO-Strings (YYYY-MM-DD) und vollständige Timestamps.
 * Beispiel: "2024-03-15" → "15.03.2024"
 */
export function datumFormatieren(datumString: string | undefined | null): string {
  if (!datumString) return '–';
  if (/^\d{4}-\d{2}-\d{2}$/.test(datumString)) {
    const [jahr, monat, tag] = datumString.split('-').map(Number);
    return new Date(jahr, monat - 1, tag).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  return new Date(datumString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Berechnet den MwSt-Anteil aus einem Bruttobetrag.
 * Beispiel: brutto=119, mwst=19 → 19.00
 */
export function steuerBerechnen(brutto: number, mwstSatz: number): number {
  return brutto - brutto / (1 + mwstSatz / 100);
}

/**
 * Berechnet den Nettobetrag aus einem Bruttobetrag.
 * Beispiel: brutto=119, mwst=19 → 100.00
 */
export function nettoBerechnen(brutto: number, mwstSatz: number): number {
  return brutto / (1 + mwstSatz / 100);
}

/**
 * Berechnet den abzugsfähigen Betrag basierend auf Abzugsquote.
 * Beispiel: brutto=100, abzug=70 → 70.00
 */
export function abzugBerechnen(brutto: number, abzugProzent: number): number {
  return brutto * (abzugProzent / 100);
}

/**
 * Gibt den Monatsnamen für einen 1-basierten Monatsindex zurück.
 * Beispiel: 3 → "März"
 */
export function monatsnameLaden(monatIndex: number): string {
  return MONATE[monatIndex - 1] ?? '–';
}

/**
 * Formatiert eine Dateigröße in lesbarer Form.
 * Beispiel: 1536 → "1,5 KB"
 */
export function dateigroesseFormatieren(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Kürzt einen Text auf eine maximale Länge und fügt "…" an.
 */
export function textKuerzen(text: string, maxLaenge: number): string {
  if (text.length <= maxLaenge) return text;
  return text.slice(0, maxLaenge) + '…';
}
