// ============================================================
// Müllplan — Vorlage Text Parser
// Parses German waste collection schedule text into termine
// ============================================================

import { MUELL_FARBEN } from './muellplan.models';

const MONTH_ABBR: Record<string, number> = {
  jan: 1,
  feb: 2,
  mär: 3,
  apr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  okt: 10,
  nov: 11,
  dez: 12,
  januar: 1,
  februar: 2,
  märz: 3,
  april: 4,
  juni: 6,
  juli: 7,
  august: 8,
  september: 9,
  oktober: 10,
  november: 11,
  dezember: 12,
};

export interface ParsedTermin {
  datum: string;
  muellart: string;
  farbe: string;
}

function findMuellType(text: string): { name: string; farbe: string } | null {
  const lower = text.toLowerCase();
  // Sort by key length descending so longer keys match first
  const sorted = Object.entries(MUELL_FARBEN).sort((a, b) => b[0].length - a[0].length);
  for (const [key, val] of sorted) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseVorlageText(text: string, jahr: number): ParsedTermin[] {
  const results: ParsedTermin[] = [];
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Detect Format A: lines starting with month name + colon
  // e.g. "Januar: Biotonne 8.22, Restmüll 8.22"
  const isFormatA = lines.some((l) => {
    const ll = l.toLowerCase();
    const colonIdx = ll.indexOf(':');
    if (colonIdx < 0) return false;
    const monthPrefix = ll.slice(0, colonIdx);
    const rest = ll.slice(colonIdx + 1);
    return Object.keys(MONTH_ABBR).some((m) => monthPrefix.startsWith(m)) && findMuellType(rest) !== null;
  });

  if (isFormatA) {
    for (const line of lines) {
      const ll = line.toLowerCase();
      let mo: number | null = null;
      for (const [abbr, num] of Object.entries(MONTH_ABBR)) {
        if (ll.startsWith(abbr)) {
          mo = num;
          break;
        }
      }
      if (!mo) continue;
      const colonIdx = line.indexOf(':');
      if (colonIdx < 0) continue;
      const rest = line.slice(colonIdx + 1);
      const parts = rest.split(',');
      for (const part of parts) {
        const type = findMuellType(part);
        if (!type) continue;
        const days = [...part.matchAll(/\b(\d{1,2})\b/g)]
          .map((m) => parseInt(m[1]))
          .filter((d) => d >= 1 && d <= 31);
        for (const day of days) {
          const dt = new Date(jahr, mo - 1, day);
          if (!isNaN(dt.getTime()) && dt.getMonth() === mo - 1) {
            results.push({
              datum: formatLocalDate(dt),
              muellart: type.name,
              farbe: type.farbe,
            });
          }
        }
      }
    }
  } else {
    // Format B: type headers + month:days lines
    let currentType: { name: string; farbe: string } | null = null;

    for (const line of lines) {
      const ll = line.toLowerCase().trim();
      if (!ll) continue;

      // Month:days line e.g. "Jan: 8. 22."
      const mColon = ll.match(/^([a-zäöü]+):\s*([\d\s.]+)/);
      if (mColon && currentType) {
        const mo = MONTH_ABBR[mColon[1].slice(0, 3)] ?? MONTH_ABBR[mColon[1]];
        if (mo) {
          const days = [...mColon[2].matchAll(/\b(\d{1,2})\b/g)]
            .map((m) => parseInt(m[1]))
            .filter((d) => d >= 1 && d <= 31);
          for (const day of days) {
            const dt = new Date(jahr, mo - 1, day);
            if (!isNaN(dt.getTime()) && dt.getMonth() === mo - 1) {
              results.push({
                datum: formatLocalDate(dt),
                muellart: currentType.name,
                farbe: currentType.farbe,
              });
            }
          }
          continue;
        }
      }

      // Type detection
      const matchedType = findMuellType(line);
      const days = [...line.matchAll(/\b(\d{1,2})\b/g)]
        .map((m) => parseInt(m[1]))
        .filter((d) => d >= 1 && d <= 31);

      if (matchedType && !days.length) {
        currentType = matchedType;
        continue;
      }
      if (matchedType) currentType = matchedType;
      if (!currentType || !days.length) continue;
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return results
    .filter((r) => {
      const k = `${r.datum  }|${  r.muellart}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => a.datum.localeCompare(b.datum));
}
