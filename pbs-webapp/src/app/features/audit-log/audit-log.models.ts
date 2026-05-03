import type { AuditLogEntry } from '../../core/models';

export type AuditAktion = 'alle' | 'CREATE' | 'UPDATE' | 'DELETE';

export const AKTION_LABELS: Record<AuditLogEntry['aktion'], string> = {
  CREATE: 'Erstellt',
  UPDATE: 'Geändert',
  DELETE: 'Gelöscht',
};

export const AKTION_KLASSEN: Record<AuditLogEntry['aktion'], string> = {
  CREATE: 'badge--green',
  UPDATE: 'badge--blue',
  DELETE: 'badge--red',
};

export const TABELLEN_LABELS: Record<string, string> = {
  kunden: 'Kunden',
  rechnungen: 'Rechnungen',
  angebote: 'Angebote',
  buchhaltung: 'Buchhaltung',
  marketing: 'Marketing',
  mitarbeiter: 'Mitarbeiter',
  objekte: 'Objekte',
  muellplan: 'Müllplan',
  hausmeister: 'Hausmeister',
  tasks: 'Aufgaben',
  belege: 'Belege',
  settings: 'Einstellungen',
};
