import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Kunde,
  Rechnung,
  Angebot,
  BuchhaltungEintrag,
  BuchhaltungJahr,
  VstPaid,
  GesperrterMonat,
  Mitarbeiter,
  MitarbeiterStunden,
  Objekt,
  MuellplanTermin,
  MuellplanVorlage,
  HausmeisterEinsatz,
  Beleg,
  AuditLogEntry,
  Benachrichtigung,
  WiederkehrendeAusgabe,
  WiederkehrendeRechnung,
  FirmaSettings,
  PdfArchiveEntry,
  Mahnung,
  BackupInfo,
  SettingsKey,
  Vertrag,
  PaginatedResponse,
} from '../models';

export interface DatevValidierungsMeldung {
  typ: 'error' | 'warning';
  msg: string;
}
export interface DatevVorschauZeile {
  datum: string;
  typ: 'inc' | 'exp';
  name: string;
  belegnr?: string;
  brutto: number;
  mwst: number;
  netto: number;
  ust: number;
  konto: string;
  shKz: string;
}
export interface DatevVorschauAntwort {
  rows: DatevVorschauZeile[];
  stats?: {
    totalInc: number;
    totalExp: number;
    sumIncNetto: number;
    sumExpNetto: number;
    zahllast: number;
  };
  warnings?: DatevValidierungsMeldung[];
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName?: string;
}
export interface UserEintrag {
  id: string;
  email: string;
  rolle: string;
  vorname: string | null;
  nachname: string | null;
  aktiv: boolean;
  created_at: string;
}
export interface UserAnlegenPayload {
  email: string;
  password: string;
  rolle: 'admin' | 'readonly' | 'mitarbeiter';
  vorname?: string;
  nachname?: string;
}
export interface UserAktualisierenPayload {
  vorname?: string;
  nachname?: string;
  rolle?: string;
}

interface Stempel {
  id: number;
  mitarbeiter_id: number;
  start: string;
  stop?: string | null;
  dauer_minuten?: number | null;
  notiz?: string | null;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly basis = '/api';

  // ── Kunden ──────────────────────────────────────────────────────────────
  loadCustomers(): Observable<Kunde[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<Kunde>>(`${this.basis}/kunden`, { params })
      .pipe(map((r) => r.data));
  }
  createCustomer(daten: Partial<Kunde>): Observable<Kunde> {
    return this.http.post<Kunde>(`${this.basis}/kunden`, daten);
  }
  updateCustomer(id: number, daten: Partial<Kunde>): Observable<Kunde> {
    return this.http.put<Kunde>(`${this.basis}/kunden/${id}`, daten);
  }
  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/kunden/${id}`);
  }

  // ── Rechnungen ──────────────────────────────────────────────────────────
  loadInvoices(): Observable<Rechnung[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<Rechnung>>(`${this.basis}/rechnungen`, { params })
      .pipe(map((r) => r.data));
  }
  createInvoice(daten: Partial<Rechnung>): Observable<Rechnung> {
    return this.http.post<Rechnung>(`${this.basis}/rechnungen`, daten);
  }
  updateInvoice(id: number, daten: Partial<Rechnung>): Observable<Rechnung> {
    return this.http.put<Rechnung>(`${this.basis}/rechnungen/${id}`, daten);
  }
  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/rechnungen/${id}`);
  }

  // ── Angebote ────────────────────────────────────────────────────────────
  loadOffers(): Observable<Angebot[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<Angebot>>(`${this.basis}/angebote`, { params })
      .pipe(map((r) => r.data));
  }
  createOffer(daten: Partial<Angebot>): Observable<Angebot> {
    return this.http.post<Angebot>(`${this.basis}/angebote`, daten);
  }
  updateOffer(id: number, daten: Partial<Angebot>): Observable<Angebot> {
    return this.http.put<Angebot>(`${this.basis}/angebote/${id}`, daten);
  }
  deleteOffer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/angebote/${id}`);
  }

  // ── Buchhaltung ─────────────────────────────────────────────────────────
  loadAccounting(jahr: number): Observable<BuchhaltungJahr> {
    return this.http.get<BuchhaltungJahr>(`${this.basis}/buchhaltung/${jahr}`);
  }
  createAccountingEntry(daten: Partial<BuchhaltungEintrag>): Observable<BuchhaltungEintrag> {
    return this.http.post<BuchhaltungEintrag>(`${this.basis}/buchhaltung`, daten);
  }
  saveAccountingBatch(
    jahr: number,
    monat: number,
    zeilen: Partial<BuchhaltungEintrag>[],
  ): Observable<BuchhaltungEintrag[]> {
    return this.http.post<BuchhaltungEintrag[]>(`${this.basis}/buchhaltung/batch`, {
      jahr,
      monat,
      rows: zeilen,
    });
  }
  updateAccountingEntry(
    id: number,
    daten: Partial<BuchhaltungEintrag>,
  ): Observable<BuchhaltungEintrag> {
    return this.http.put<BuchhaltungEintrag>(`${this.basis}/buchhaltung/${id}`, daten);
  }
  deleteAccountingEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/buchhaltung/${id}`);
  }

  // ── VST ─────────────────────────────────────────────────────────────────
  loadVst(jahr: number): Observable<VstPaid[]> {
    return this.http.get<VstPaid[]>(`${this.basis}/vst/${jahr}`);
  }
  saveVst(daten: Partial<VstPaid>): Observable<VstPaid> {
    return this.http.post<VstPaid>(`${this.basis}/vst`, daten);
  }

  // ── Gesperrte Monate ────────────────────────────────────────────────────
  loadLockedMonths(jahr: number): Observable<GesperrterMonat[]> {
    return this.http.get<GesperrterMonat[]>(`${this.basis}/gesperrte-monate/${jahr}`);
  }
  lockMonth(jahr: number, monat: number): Observable<GesperrterMonat> {
    return this.http.post<GesperrterMonat>(`${this.basis}/gesperrte-monate`, { jahr, monat });
  }
  unlockMonth(jahr: number, monat: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/gesperrte-monate/${jahr}/${monat}`);
  }

  // ── Mitarbeiter ─────────────────────────────────────────────────────────
  loadEmployees(): Observable<Mitarbeiter[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<Mitarbeiter>>(`${this.basis}/mitarbeiter`, { params })
      .pipe(map((r) => r.data));
  }
  createEmployee(daten: Partial<Mitarbeiter>): Observable<Mitarbeiter> {
    return this.http.post<Mitarbeiter>(`${this.basis}/mitarbeiter`, daten);
  }
  updateEmployee(id: number, daten: Partial<Mitarbeiter>): Observable<Mitarbeiter> {
    return this.http.put<Mitarbeiter>(`${this.basis}/mitarbeiter/${id}`, daten);
  }
  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/mitarbeiter/${id}`);
  }
  loadEmployeeHours(mitarbeiterId: number): Observable<MitarbeiterStunden[]> {
    return this.http.get<MitarbeiterStunden[]>(
      `${this.basis}/mitarbeiter/${mitarbeiterId}/stunden`,
    );
  }
  createEmployeeHours(
    mitarbeiterId: number,
    daten: Partial<MitarbeiterStunden>,
  ): Observable<MitarbeiterStunden> {
    return this.http.post<MitarbeiterStunden>(
      `${this.basis}/mitarbeiter/${mitarbeiterId}/stunden`,
      daten,
    );
  }
  updateEmployeeHours(
    stundenId: number,
    daten: Partial<MitarbeiterStunden>,
  ): Observable<MitarbeiterStunden> {
    return this.http.put<MitarbeiterStunden>(
      `${this.basis}/mitarbeiter/stunden/${stundenId}`,
      daten,
    );
  }
  deleteEmployeeHours(stundenId: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/mitarbeiter/stunden/${stundenId}`);
  }

  // ── Mobile Stempeluhr ───────────────────────────────────────────────────
  clockIn(mitarbeiterId: number, daten: { notiz?: string }): Observable<Stempel> {
    return this.http.post<Stempel>(
      `${this.basis}/mitarbeiter/${mitarbeiterId}/stempel/start`,
      daten,
    );
  }
  clockOut(mitarbeiterId: number): Observable<Stempel> {
    return this.http.post<Stempel>(`${this.basis}/mitarbeiter/${mitarbeiterId}/stempel/stop`, {});
  }
  loadTimeTracking(mitarbeiterId: number): Observable<Stempel[]> {
    return this.http.get<Stempel[]>(`${this.basis}/mitarbeiter/${mitarbeiterId}/zeiterfassung`);
  }

  // ── Objekte ─────────────────────────────────────────────────────────────
  loadObjects(): Observable<Objekt[]> {
    return this.http.get<Objekt[]>(`${this.basis}/objekte`);
  }
  createObject(daten: Partial<Objekt>): Observable<Objekt> {
    return this.http.post<Objekt>(`${this.basis}/objekte`, daten);
  }
  updateObject(id: number, daten: Partial<Objekt>): Observable<Objekt> {
    return this.http.put<Objekt>(`${this.basis}/objekte/${id}`, daten);
  }
  deleteObject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/objekte/${id}`);
  }

  // ── Müllplan ────────────────────────────────────────────────────────────
  loadGarbagePlan(objektId: number): Observable<MuellplanTermin[]> {
    return this.http.get<MuellplanTermin[]>(`${this.basis}/muellplan/${objektId}`);
  }
  loadUpcomingGarbageTerms(limit = 5): Observable<MuellplanTermin[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<MuellplanTermin[]>(`${this.basis}/muellplan-upcoming`, { params });
  }
  createGarbageTerm(daten: Partial<MuellplanTermin>): Observable<MuellplanTermin> {
    return this.http.post<MuellplanTermin>(`${this.basis}/muellplan`, daten);
  }
  updateGarbageTerm(id: number, daten: Partial<MuellplanTermin>): Observable<MuellplanTermin> {
    return this.http.put<MuellplanTermin>(`${this.basis}/muellplan/${id}`, daten);
  }
  deleteGarbageTerm(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/muellplan/${id}`);
  }

  // ── Müllplan-Vorlagen ───────────────────────────────────────────────────
  loadGarbageTemplates(): Observable<MuellplanVorlage[]> {
    return this.http.get<MuellplanVorlage[]>(`${this.basis}/muellplan-vorlagen`);
  }
  loadGarbageTemplate(id: number): Observable<MuellplanVorlage> {
    return this.http.get<MuellplanVorlage>(`${this.basis}/muellplan-vorlagen/${id}`);
  }
  createGarbageTemplate(daten: Partial<MuellplanVorlage>): Observable<MuellplanVorlage> {
    return this.http.post<MuellplanVorlage>(`${this.basis}/muellplan-vorlagen`, daten);
  }
  deleteGarbageTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/muellplan-vorlagen/${id}`);
  }
  createGarbageTemplatePdf(id: number): Observable<void> {
    return this.http.post<void>(`${this.basis}/muellplan-vorlagen/${id}/pdf`, {});
  }
  uploadGarbageTemplatePdf(id: number, file: File): Observable<{ ok: boolean; pdf_name: string }> {
    const fd = new FormData();
    fd.append('pdf', file, file.name);
    return this.http.post<{ ok: boolean; pdf_name: string }>(
      `${this.basis}/muellplan-vorlagen/${id}/pdf`,
      fd,
    );
  }
  getGarbageTemplatePdfUrl(id: number): string {
    return `${this.basis}/muellplan-vorlagen/${id}/pdf`;
  }
  createObjectGarbagePdf(objektId: number): Observable<void> {
    return this.http.post<void>(`${this.basis}/muellplan-pdf/${objektId}`, {});
  }
  confirmObjectGarbagePdf(objektId: number): Observable<void> {
    return this.http.post<void>(`${this.basis}/muellplan-pdf/${objektId}/confirm`, {});
  }
  copyGarbageTerms(vonObjektId: number, zuObjektId: number): Observable<void> {
    return this.http.post<void>(`${this.basis}/muellplan/copy`, {
      from_objekt_id: vonObjektId,
      to_objekt_id: zuObjektId,
    });
  }

  // ── Hausmeister ─────────────────────────────────────────────────────────
  loadServiceAssignments(): Observable<HausmeisterEinsatz[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<HausmeisterEinsatz>>(`${this.basis}/hausmeister`, { params })
      .pipe(map((r) => r.data));
  }
  createServiceAssignment(daten: Partial<HausmeisterEinsatz>): Observable<HausmeisterEinsatz> {
    return this.http.post<HausmeisterEinsatz>(`${this.basis}/hausmeister`, daten);
  }
  updateServiceAssignment(
    id: number,
    daten: Partial<HausmeisterEinsatz>,
  ): Observable<HausmeisterEinsatz> {
    return this.http.put<HausmeisterEinsatz>(`${this.basis}/hausmeister/${id}`, daten);
  }
  deleteServiceAssignment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/hausmeister/${id}`);
  }

  // ── Tasks (Kanban) ──────────────────────────────────────────────────────
  // ── Belege ──────────────────────────────────────────────────────────────
  loadReceipts(jahr?: number): Observable<Beleg[]> {
    let params = new HttpParams().set('pageSize', '1000');
    if (jahr) params = params.set('jahr', jahr);
    return this.http
      .get<PaginatedResponse<Beleg>>(`${this.basis}/belege`, { params })
      .pipe(map((r) => r.data));
  }
  loadReceipt(id: number): Observable<Beleg> {
    return this.http.get<Beleg>(`${this.basis}/belege/${id}`);
  }
  loadReceiptsForEntry(buchungId: number): Observable<Beleg[]> {
    return this.http.get<Beleg[]>(`${this.basis}/belege/buchhaltung/${buchungId}`);
  }
  uploadReceipt(formData: FormData): Observable<Beleg> {
    return this.http.post<Beleg>(`${this.basis}/belege/upload`, formData);
  }
  updateReceiptNote(id: number, notiz: string): Observable<Beleg> {
    return this.http.patch<Beleg>(`${this.basis}/belege/${id}/notiz`, { notiz });
  }
  deleteReceipt(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/belege/${id}`);
  }
  getReceiptDownloadUrl(id: number, inline = false): string {
    return `${this.basis}/belege/${id}/download${inline ? '?inline=1' : ''}`;
  }

  // ── Einstellungen ───────────────────────────────────────────────────────
  loadSettings(schluessel: SettingsKey): Observable<FirmaSettings> {
    return this.http.get<FirmaSettings>(`${this.basis}/settings/${schluessel}`);
  }
  saveSettings(schluessel: SettingsKey, daten: Partial<FirmaSettings>): Observable<FirmaSettings> {
    return this.http.post<FirmaSettings>(`${this.basis}/settings/${schluessel}`, daten);
  }

  // ── Benachrichtigungen ──────────────────────────────────────────────────
  loadNotifications(): Observable<Benachrichtigung[]> {
    return this.http.get<Benachrichtigung[]>(`${this.basis}/benachrichtigungen`);
  }
  markAllNotificationsRead(): Observable<void> {
    return this.http.post<void>(`${this.basis}/benachrichtigungen/alle-lesen`, {});
  }
  markNotificationRead(id: number): Observable<void> {
    return this.http.post<void>(`${this.basis}/benachrichtigungen/${id}/lesen`, {});
  }

  // ── Audit-Log ───────────────────────────────────────────────────────────
  loadAuditLogAll(): Observable<AuditLogEntry[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<AuditLogEntry>>(`${this.basis}/audit/all`, { params })
      .pipe(map((r) => r.data));
  }
  loadAuditLogForTable(tabelle: string): Observable<AuditLogEntry[]> {
    const params = new HttpParams().set('pageSize', '1000');
    return this.http
      .get<PaginatedResponse<AuditLogEntry>>(`${this.basis}/audit/${tabelle}/all`, { params })
      .pipe(map((r) => r.data));
  }
  loadAuditLogForRecord(tabelle: string, id: number): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${this.basis}/audit/${tabelle}/${id}`);
  }

  // ── DATEV ────────────────────────────────────────────────────────────────
  validateDatev(jahr: number, monat: number): Observable<DatevVorschauAntwort> {
    const params = new HttpParams().set('jahr', jahr).set('monat', monat);
    return this.http.get<DatevVorschauAntwort>(`${this.basis}/datev/validate`, { params });
  }
  loadDatevPreview(jahr: number, monat: number): Observable<DatevVorschauAntwort> {
    const params = new HttpParams().set('jahr', jahr).set('monat', monat);
    return this.http.get<DatevVorschauAntwort>(`${this.basis}/datev/preview`, { params });
  }
  getDatevExportUrl(jahr: number, monat: number): string {
    return `${this.basis}/datev/export?jahr=${jahr}&monat=${monat}`;
  }
  getDatevExcelUrl(jahr: number, monat: number): string {
    return `${this.basis}/datev/excel?jahr=${jahr}&monat=${monat}`;
  }

  // ── Wiederkehrende Ausgaben ─────────────────────────────────────────────
  loadRecurringExpenses(): Observable<WiederkehrendeAusgabe[]> {
    return this.http.get<WiederkehrendeAusgabe[]>(`${this.basis}/wiederkehrend`);
  }
  createRecurringExpense(daten: Partial<WiederkehrendeAusgabe>): Observable<WiederkehrendeAusgabe> {
    return this.http.post<WiederkehrendeAusgabe>(`${this.basis}/wiederkehrend`, daten);
  }
  updateRecurringExpense(
    id: number,
    daten: Partial<WiederkehrendeAusgabe>,
  ): Observable<WiederkehrendeAusgabe> {
    return this.http.put<WiederkehrendeAusgabe>(`${this.basis}/wiederkehrend/${id}`, daten);
  }
  deleteRecurringExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/wiederkehrend/${id}`);
  }

  // ── Wiederkehrende Rechnungen ───────────────────────────────────────────
  loadRecurringInvoices(): Observable<WiederkehrendeRechnung[]> {
    return this.http.get<WiederkehrendeRechnung[]>(`${this.basis}/wiederkehrend-rechnungen`);
  }
  createRecurringInvoice(
    daten: Partial<WiederkehrendeRechnung>,
  ): Observable<WiederkehrendeRechnung> {
    return this.http.post<WiederkehrendeRechnung>(`${this.basis}/wiederkehrend-rechnungen`, daten);
  }
  updateRecurringInvoice(
    id: number,
    daten: Partial<WiederkehrendeRechnung>,
  ): Observable<WiederkehrendeRechnung> {
    return this.http.put<WiederkehrendeRechnung>(
      `${this.basis}/wiederkehrend-rechnungen/${id}`,
      daten,
    );
  }
  deleteRecurringInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/wiederkehrend-rechnungen/${id}`);
  }

  // ── Mahnungen ───────────────────────────────────────────────────────────
  loadReminders(rechnungId: number): Observable<Mahnung[]> {
    return this.http.get<Mahnung[]>(`${this.basis}/mahnungen/${rechnungId}`);
  }
  createReminder(daten: Partial<Mahnung>): Observable<Mahnung> {
    return this.http.post<Mahnung>(`${this.basis}/mahnungen`, daten);
  }
  deleteReminder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/mahnungen/${id}`);
  }

  // ── PDF (JSON-basiert — Backend rendert mit Handlebars) ──────────────────
  createInvoicePdf(rechnungId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.basis}/pdf/rechnung`, {
      rechnung_id: rechnungId,
    });
  }
  createOfferPdf(angebotId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.basis}/pdf/angebot`, {
      angebot_id: angebotId,
    });
  }
  createEuerPdf(
    jahr: number,
    ergebnis: Record<string, unknown>,
  ): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.basis}/pdf/euer`, {
      jahr,
      ergebnis,
    });
  }
  createServiceAssignmentPdf(einsatzId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.basis}/pdf/hausmeister/einsatz`, {
      einsatz_id: einsatzId,
    });
  }
  createServiceMonthlyReportPdf(
    monat: string,
    mitarbeiterName?: string,
  ): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.basis}/pdf/hausmeister/monat`, {
      monat,
      mitarbeiter_name: mitarbeiterName,
    });
  }
  mitarbeiterAbcreateInvoicePdf(mitarbeiterId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(
      `${this.basis}/pdf/mitarbeiter/abrechnung`,
      { mitarbeiter_id: mitarbeiterId },
    );
  }
  loadPdfArchive(): Observable<PdfArchiveEntry[]> {
    return this.http.get<PdfArchiveEntry[]>(`${this.basis}/pdf/archiv`);
  }

  // ── Verträge ────────────────────────────────────────────────────────────
  loadContracts(kundenId?: number): Observable<Vertrag[]> {
    let params = new HttpParams().set('pageSize', '1000');
    if (kundenId) params = params.set('kunden_id', kundenId);
    return this.http
      .get<PaginatedResponse<Vertrag>>(`${this.basis}/vertraege`, { params })
      .pipe(map((r) => r.data));
  }
  createContract(daten: Partial<Vertrag>): Observable<Vertrag> {
    return this.http.post<Vertrag>(`${this.basis}/vertraege`, daten);
  }
  updateContract(id: number, daten: Partial<Vertrag>): Observable<Vertrag> {
    return this.http.put<Vertrag>(`${this.basis}/vertraege/${id}`, daten);
  }
  deleteContract(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/vertraege/${id}`);
  }
  createContractPdf(id: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.basis}/vertraege/${id}/pdf`, {});
  }

  // ── SMTP & Benutzerverwaltung ────────────────────────────────────────────
  loadSmtp(): Observable<SmtpSettings> {
    return this.http.get<SmtpSettings>(`${this.basis}/settings/smtp`);
  }
  saveSmtp(daten: SmtpSettings): Observable<SmtpSettings> {
    return this.http.post<SmtpSettings>(`${this.basis}/settings/smtp`, daten);
  }
  testEmail(): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(`${this.basis}/email/test`, {});
  }
  loadUsers(): Observable<UserEintrag[]> {
    return this.http.get<UserEintrag[]>(`${this.basis}/auth/users`);
  }
  createUser(payload: UserAnlegenPayload): Observable<UserEintrag> {
    return this.http.post<UserEintrag>(`${this.basis}/auth/users`, payload);
  }
  updateUser(id: string, daten: UserAktualisierenPayload): Observable<UserEintrag> {
    return this.http.patch<UserEintrag>(`${this.basis}/auth/users/${id}`, daten);
  }
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.basis}/auth/users/${id}`);
  }

  // ── PDF-Archiv (Delete) ─────────────────────────────────────────────────
  deletePdfArchiveEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/pdf/archiv/${id}`);
  }
  deleteAllPdfArchive(): Observable<{ ok: boolean; deleted: number }> {
    return this.http.delete<{ ok: boolean; deleted: number }>(`${this.basis}/pdf/archiv/cleanup`);
  }

  // ── Backup ──────────────────────────────────────────────────────────────
  createBackup(): Observable<BackupInfo> {
    return this.http.post<BackupInfo>(`${this.basis}/backup`, {});
  }
  loadLastBackup(): Observable<BackupInfo> {
    return this.http.get<BackupInfo>(`${this.basis}/backup/last`);
  }
  loadBackupFiles(): Observable<BackupInfo[]> {
    return this.http.get<BackupInfo[]>(`${this.basis}/backup/files`);
  }
}
