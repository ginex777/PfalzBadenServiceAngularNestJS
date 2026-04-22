// ============================================================
// @pbs/types — Shared TypeScript models
// Source of truth for frontend AND backend response shapes.
// Both pbs-webapp and pbs-backend import from here.
// ============================================================

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Kunde {
  id: number;
  name: string;
  strasse?: string;
  ort?: string;
  tel?: string;
  email?: string;
  notiz?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RechnungPosition {
  bez: string;
  stunden?: number | string;
  einzelpreis?: number;
  gesamtpreis: number;
}

export interface Rechnung {
  id: number;
  nr: string;
  empf: string;
  str?: string;
  ort?: string;
  titel?: string;
  datum?: string;
  leistungsdatum?: string;
  email?: string;
  zahlungsziel?: number;
  kunden_id?: number;
  brutto: number;
  frist?: string;
  bezahlt: boolean;
  bezahlt_am?: string;
  positionen: RechnungPosition[];
  mwst_satz?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Angebot {
  id: number;
  nr: string;
  empf: string;
  str?: string;
  ort?: string;
  titel?: string;
  datum?: string;
  brutto: number;
  gueltig_bis?: string;
  angenommen: boolean;
  abgelehnt: boolean;
  gesendet: boolean;
  zusatz?: string;
  positionen: RechnungPosition[];
  kunden_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BuchhaltungEintrag {
  id: number;
  jahr: number;
  monat: number;
  typ: 'inc' | 'exp';
  name?: string;
  datum?: string;
  brutto: number;
  mwst: number;
  abzug: number;
  kategorie?: string;
  renr?: string;
  belegnr?: string;
  beleg_id?: number;
}

export type BuchhaltungJahr = Record<number, { inc: BuchhaltungEintrag[]; exp: BuchhaltungEintrag[] }>;

export interface VstPaid {
  id: number;
  jahr: number;
  quartal: string;
  paid: boolean;
  datum?: string;
}

export interface Mitarbeiter {
  id: number;
  name: string;
  rolle?: string;
  stundenlohn: number;
  email?: string;
  tel?: string;
  notiz?: string;
  aktiv: boolean;
  created_at?: string;
}

export interface MitarbeiterStunden {
  id: number;
  mitarbeiter_id: number;
  datum: string;
  stunden: number;
  beschreibung?: string;
  ort?: string;
  lohn: number;
  zuschlag: number;
  zuschlag_typ?: string;
  bezahlt: boolean;
}

export interface Stempel {
  id: number;
  mitarbeiter_id: number;
  start: string;
  stop?: string | null;
  dauer_minuten?: number | null;
  notiz?: string | null;
  created_at?: string;
}

export interface Objekt {
  id: number;
  name: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  notiz?: string;
  kunden_id?: number;
  vorlage_id?: number;
}

export interface MuellplanTermin {
  id: number;
  objekt_id: number;
  muellart: string;
  farbe: string;
  abholung: string;
  erledigt: boolean;
  objekt_name?: string;
}

export interface MuellplanVorlage {
  id: number;
  name: string;
  inhalt?: string;
  pdf_name?: string;
}

export interface HausmeisterEinsatz {
  id: number;
  mitarbeiter_id?: number;
  mitarbeiter_name: string;
  kunden_id?: number;
  kunden_name?: string;
  datum: string;
  taetigkeiten: Taetigkeit[];
  stunden_gesamt: number;
  notiz?: string;
  abgeschlossen: boolean;
}

export interface Taetigkeit {
  beschreibung: string;
  stunden: number;
}

export interface Beleg {
  id: number;
  buchhaltung_id?: number;
  filename: string;
  mimetype: string;
  filesize: number;
  sha256: string;
  typ: 'beleg' | 'rechnung' | 'quittung' | 'sonstiges';
  notiz?: string;
  aufbewahrung_bis?: string;
  erstellt_am?: string;
  buchung_name?: string;
  buchung_brutto?: number;
  buchung_kategorie?: string;
}

export interface AuditLogEntry {
  id: number;
  tabelle: string;
  datensatz_id: number;
  aktion: 'CREATE' | 'UPDATE' | 'DELETE';
  alt_wert?: string;
  neu_wert?: string;
  zeitstempel: string;
  nutzer?: string | null;
  nutzer_name?: string | null;
}

export interface Benachrichtigung {
  id: number;
  typ: string;
  titel: string;
  nachricht?: string;
  link?: string;
  gelesen: boolean;
  erstellt_am: string;
}

export interface WiederkehrendeAusgabe {
  id: number;
  name: string;
  kategorie: string;
  brutto: number;
  mwst: number;
  abzug: number;
  belegnr?: string;
  aktiv: boolean;
}

export interface WiederkehrendeRechnung {
  id: number;
  kunden_id?: number;
  kunden_name?: string;
  titel: string;
  positionen: RechnungPosition[];
  intervall: string;
  aktiv: boolean;
  letzte_erstellung?: string;
}

export interface FirmaSettings {
  firma?: string;
  zusatz?: string;
  strasse?: string;
  ort?: string;
  steuernr?: string;
  ustId?: string;
  gf?: string;
  tel?: string;
  email?: string;
  bank?: string;
  iban?: string;
  bic?: string;
  datev_beraternr?: string;
  datev_mandantennr?: string;
}

export interface PdfArchiveEntry {
  id: number;
  typ: string;
  referenz_nr: string;
  referenz_id?: number;
  empf?: string;
  titel?: string;
  datum?: string;
  filename: string;
  erstellt_am: string;
}

export interface Mahnung {
  id: number;
  rechnung_id: number;
  datum: string;
  stufe: number;
  betrag_gebuehr?: number;
  notiz?: string;
}

export interface DatevValidation {
  valid: boolean;
  fehler: string[];
  warnungen: string[];
}

export interface DatevPreviewRow {
  datum: string;
  betrag: number;
  mwst: number;
  kategorie: string;
  name: string;
  belegnr?: string;
  typ: 'inc' | 'exp';
}

export interface BackupInfo {
  filename: string;
  erstellt_am: string;
  groesse: number;
}

export interface GesperrterMonat {
  jahr: number;
  monat: number;
}

export type SettingsKey = 'firma' | 'marketing_template' | 'smtp';

export type VertragVorlage = 'Wartungsvertrag' | 'Hausmeistervertrag' | 'Dienstleistungsvertrag';
export type VertragStatus = 'aktiv' | 'beendet' | 'gekuendigt';

export interface Vertrag {
  id: number;
  kunden_id: number | null;
  kunden_name: string;
  kunden_strasse?: string | null;
  kunden_ort?: string | null;
  vorlage: VertragVorlage | string;
  titel: string;
  vertragsbeginn: string;
  laufzeit_monate: number;
  monatliche_rate: number;
  leistungsumfang?: string | null;
  kuendigungsfrist: number;
  pdf_filename?: string | null;
  status: VertragStatus | string;
  created_at?: string;
  updated_at?: string;
}
