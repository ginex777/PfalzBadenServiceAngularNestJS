import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Kunde, Rechnung, Angebot, BuchhaltungEintrag, BuchhaltungJahr,
  VstPaid, GesperrterMonat, MarketingKontakt, Mitarbeiter, MitarbeiterStunden,
  Objekt, MuellplanTermin, MuellplanVorlage, HausmeisterEinsatz, Task,
  TaskReorderUpdate, Beleg, AuditLogEntry, Benachrichtigung,
  WiederkehrendeAusgabe, WiederkehrendeRechnung, FirmaSettings,
  PdfArchiveEntry, Mahnung, DatevValidation, DatevPreviewRow,
  BackupInfo, SettingsKey,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly basis = '/api';

  // ── Kunden ──────────────────────────────────────────────────────────────
  kundenLaden(): Observable<Kunde[]> {
    return this.http.get<Kunde[]>(`${this.basis}/kunden`);
  }
  kundeErstellen(daten: Partial<Kunde>): Observable<Kunde> {
    return this.http.post<Kunde>(`${this.basis}/kunden`, daten);
  }
  kundeAktualisieren(id: number, daten: Partial<Kunde>): Observable<Kunde> {
    return this.http.put<Kunde>(`${this.basis}/kunden/${id}`, daten);
  }
  kundeLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/kunden/${id}`);
  }

  // ── Rechnungen ──────────────────────────────────────────────────────────
  rechnungenLaden(): Observable<Rechnung[]> {
    return this.http.get<Rechnung[]>(`${this.basis}/rechnungen`);
  }
  rechnungErstellen(daten: Partial<Rechnung>): Observable<Rechnung> {
    return this.http.post<Rechnung>(`${this.basis}/rechnungen`, daten);
  }
  rechnungAktualisieren(id: number, daten: Partial<Rechnung>): Observable<Rechnung> {
    return this.http.put<Rechnung>(`${this.basis}/rechnungen/${id}`, daten);
  }
  rechnungLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/rechnungen/${id}`);
  }

  // ── Angebote ────────────────────────────────────────────────────────────
  angeboteLaden(): Observable<Angebot[]> {
    return this.http.get<Angebot[]>(`${this.basis}/angebote`);
  }
  angebotErstellen(daten: Partial<Angebot>): Observable<Angebot> {
    return this.http.post<Angebot>(`${this.basis}/angebote`, daten);
  }
  angebotAktualisieren(id: number, daten: Partial<Angebot>): Observable<Angebot> {
    return this.http.put<Angebot>(`${this.basis}/angebote/${id}`, daten);
  }
  angebotLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/angebote/${id}`);
  }

  // ── Buchhaltung ─────────────────────────────────────────────────────────
  buchhaltungLaden(jahr: number): Observable<BuchhaltungJahr> {
    return this.http.get<BuchhaltungJahr>(`${this.basis}/buchhaltung/${jahr}`);
  }
  buchhaltungEintragErstellen(daten: Partial<BuchhaltungEintrag>): Observable<BuchhaltungEintrag> {
    return this.http.post<BuchhaltungEintrag>(`${this.basis}/buchhaltung`, daten);
  }
  buchhaltungBatchSpeichern(jahr: number, monat: number, zeilen: Partial<BuchhaltungEintrag>[]): Observable<BuchhaltungEintrag[]> {
    return this.http.post<BuchhaltungEintrag[]>(`${this.basis}/buchhaltung/batch`, { jahr, monat, rows: zeilen });
  }
  buchhaltungEintragAktualisieren(id: number, daten: Partial<BuchhaltungEintrag>): Observable<BuchhaltungEintrag> {
    return this.http.put<BuchhaltungEintrag>(`${this.basis}/buchhaltung/${id}`, daten);
  }
  buchhaltungEintragLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/buchhaltung/${id}`);
  }

  // ── VST ─────────────────────────────────────────────────────────────────
  vstLaden(jahr: number): Observable<VstPaid[]> {
    return this.http.get<VstPaid[]>(`${this.basis}/vst/${jahr}`);
  }
  vstSpeichern(daten: Partial<VstPaid>): Observable<VstPaid> {
    return this.http.post<VstPaid>(`${this.basis}/vst`, daten);
  }

  // ── Gesperrte Monate ────────────────────────────────────────────────────
  gesperrteMonateLaden(jahr: number): Observable<GesperrterMonat[]> {
    return this.http.get<GesperrterMonat[]>(`${this.basis}/gesperrte-monate/${jahr}`);
  }
  monatSperren(jahr: number, monat: number): Observable<GesperrterMonat> {
    return this.http.post<GesperrterMonat>(`${this.basis}/gesperrte-monate`, { jahr, monat });
  }
  monatEntsperren(jahr: number, monat: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/gesperrte-monate/${jahr}/${monat}`);
  }

  // ── Marketing ───────────────────────────────────────────────────────────
  marketingKontakteLaden(): Observable<MarketingKontakt[]> {
    return this.http.get<MarketingKontakt[]>(`${this.basis}/marketing`);
  }
  marketingKontaktErstellen(daten: Partial<MarketingKontakt>): Observable<MarketingKontakt> {
    return this.http.post<MarketingKontakt>(`${this.basis}/marketing`, daten);
  }
  marketingKontaktAktualisieren(id: number, daten: Partial<MarketingKontakt>): Observable<MarketingKontakt> {
    return this.http.put<MarketingKontakt>(`${this.basis}/marketing/${id}`, daten);
  }
  marketingKontaktLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/marketing/${id}`);
  }

  // ── Mitarbeiter ─────────────────────────────────────────────────────────
  mitarbeiterLaden(): Observable<Mitarbeiter[]> {
    return this.http.get<Mitarbeiter[]>(`${this.basis}/mitarbeiter`);
  }
  mitarbeiterErstellen(daten: Partial<Mitarbeiter>): Observable<Mitarbeiter> {
    return this.http.post<Mitarbeiter>(`${this.basis}/mitarbeiter`, daten);
  }
  mitarbeiterAktualisieren(id: number, daten: Partial<Mitarbeiter>): Observable<Mitarbeiter> {
    return this.http.put<Mitarbeiter>(`${this.basis}/mitarbeiter/${id}`, daten);
  }
  mitarbeiterLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/mitarbeiter/${id}`);
  }
  mitarbeiterStundenLaden(mitarbeiterId: number): Observable<MitarbeiterStunden[]> {
    return this.http.get<MitarbeiterStunden[]>(`${this.basis}/mitarbeiter/${mitarbeiterId}/stunden`);
  }
  mitarbeiterStundenErstellen(mitarbeiterId: number, daten: Partial<MitarbeiterStunden>): Observable<MitarbeiterStunden> {
    return this.http.post<MitarbeiterStunden>(`${this.basis}/mitarbeiter/${mitarbeiterId}/stunden`, daten);
  }
  mitarbeiterStundenAktualisieren(stundenId: number, daten: Partial<MitarbeiterStunden>): Observable<MitarbeiterStunden> {
    return this.http.put<MitarbeiterStunden>(`${this.basis}/mitarbeiter/stunden/${stundenId}`, daten);
  }
  mitarbeiterStundenLoeschen(stundenId: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/mitarbeiter/stunden/${stundenId}`);
  }

  // ── Objekte ─────────────────────────────────────────────────────────────
  objekteLaden(): Observable<Objekt[]> {
    return this.http.get<Objekt[]>(`${this.basis}/objekte`);
  }
  objektErstellen(daten: Partial<Objekt>): Observable<Objekt> {
    return this.http.post<Objekt>(`${this.basis}/objekte`, daten);
  }
  objektAktualisieren(id: number, daten: Partial<Objekt>): Observable<Objekt> {
    return this.http.put<Objekt>(`${this.basis}/objekte/${id}`, daten);
  }
  objektLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/objekte/${id}`);
  }

  // ── Müllplan ────────────────────────────────────────────────────────────
  muellplanLaden(objektId: number): Observable<MuellplanTermin[]> {
    return this.http.get<MuellplanTermin[]>(`${this.basis}/muellplan/${objektId}`);
  }
  muellplanAnstehendeTermineLaden(limit = 5): Observable<MuellplanTermin[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<MuellplanTermin[]>(`${this.basis}/muellplan-upcoming`, { params });
  }
  muellplanTerminErstellen(daten: Partial<MuellplanTermin>): Observable<MuellplanTermin> {
    return this.http.post<MuellplanTermin>(`${this.basis}/muellplan`, daten);
  }
  muellplanTerminAktualisieren(id: number, daten: Partial<MuellplanTermin>): Observable<MuellplanTermin> {
    return this.http.put<MuellplanTermin>(`${this.basis}/muellplan/${id}`, daten);
  }
  muellplanTerminLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/muellplan/${id}`);
  }

  // ── Müllplan-Vorlagen ───────────────────────────────────────────────────
  muellplanVorlagenLaden(): Observable<MuellplanVorlage[]> {
    return this.http.get<MuellplanVorlage[]>(`${this.basis}/muellplan-vorlagen`);
  }
  muellplanVorlageLaden(id: number): Observable<MuellplanVorlage> {
    return this.http.get<MuellplanVorlage>(`${this.basis}/muellplan-vorlagen/${id}`);
  }
  muellplanVorlageErstellen(daten: Partial<MuellplanVorlage>): Observable<MuellplanVorlage> {
    return this.http.post<MuellplanVorlage>(`${this.basis}/muellplan-vorlagen`, daten);
  }
  muellplanVorlageLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/muellplan-vorlagen/${id}`);
  }
  muellplanVorlagePdfErstellen(id: number): Observable<void> {
    return this.http.post<void>(`${this.basis}/muellplan-vorlagen/${id}/pdf`, {});
  }
  muellplanVorlagePdfHochladen(id: number, file: File): Observable<{ ok: boolean; pdf_name: string }> {
    const fd = new FormData();
    fd.append('pdf', file, file.name);
    return this.http.post<{ ok: boolean; pdf_name: string }>(`${this.basis}/muellplan-vorlagen/${id}/pdf`, fd);
  }
  muellplanVorlagePdfUrl(id: number): string {
    return `${this.basis}/muellplan-vorlagen/${id}/pdf`;
  }
  muellplanObjektPdfErstellen(objektId: number): Observable<void> {
    return this.http.post<void>(`${this.basis}/muellplan-pdf/${objektId}`, {});
  }
  muellplanObjektPdfBestaetigen(objektId: number): Observable<void> {
    return this.http.post<void>(`${this.basis}/muellplan-pdf/${objektId}/confirm`, {});
  }
  muellplanTermineKopieren(vonObjektId: number, zuObjektId: number): Observable<void> {
    return this.http.post<void>(`${this.basis}/muellplan/copy`, { from_objekt_id: vonObjektId, to_objekt_id: zuObjektId });
  }

  // ── Hausmeister ─────────────────────────────────────────────────────────
  hausmeisterEinsaetzeLaden(): Observable<HausmeisterEinsatz[]> {
    return this.http.get<HausmeisterEinsatz[]>(`${this.basis}/hausmeister`);
  }
  hausmeisterEinsatzErstellen(daten: Partial<HausmeisterEinsatz>): Observable<HausmeisterEinsatz> {
    return this.http.post<HausmeisterEinsatz>(`${this.basis}/hausmeister`, daten);
  }
  hausmeisterEinsatzAktualisieren(id: number, daten: Partial<HausmeisterEinsatz>): Observable<HausmeisterEinsatz> {
    return this.http.put<HausmeisterEinsatz>(`${this.basis}/hausmeister/${id}`, daten);
  }
  hausmeisterEinsatzLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/hausmeister/${id}`);
  }

  // ── Tasks (Kanban) ──────────────────────────────────────────────────────
  tasksLaden(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.basis}/tasks`);
  }
  taskErstellen(daten: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(`${this.basis}/tasks`, daten);
  }
  taskAktualisieren(id: number, daten: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${this.basis}/tasks/${id}`, daten);
  }
  taskLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/tasks/${id}`);
  }
  tasksNeuAnordnen(aktualisierungen: TaskReorderUpdate[]): Observable<void> {
    return this.http.post<void>(`${this.basis}/tasks/reorder`, { updates: aktualisierungen });
  }

  // ── Belege ──────────────────────────────────────────────────────────────
  belegeLaden(jahr?: number): Observable<Beleg[]> {
    const params = jahr ? new HttpParams().set('jahr', jahr) : undefined;
    return this.http.get<Beleg[]>(`${this.basis}/belege`, { params });
  }
  belegLaden(id: number): Observable<Beleg> {
    return this.http.get<Beleg>(`${this.basis}/belege/${id}`);
  }
  belegeFuerBuchungLaden(buchungId: number): Observable<Beleg[]> {
    return this.http.get<Beleg[]>(`${this.basis}/belege/buchhaltung/${buchungId}`);
  }
  belegHochladen(formData: FormData): Observable<Beleg> {
    return this.http.post<Beleg>(`${this.basis}/belege/upload`, formData);
  }
  belegNotizAktualisieren(id: number, notiz: string): Observable<Beleg> {
    return this.http.patch<Beleg>(`${this.basis}/belege/${id}/notiz`, { notiz });
  }
  belegLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/belege/${id}`);
  }
  belegDownloadUrl(id: number, inline = false): string {
    return `${this.basis}/belege/${id}/download${inline ? '?inline=1' : ''}`;
  }

  // ── Einstellungen ───────────────────────────────────────────────────────
  einstellungenLaden(schluessel: SettingsKey): Observable<FirmaSettings> {
    return this.http.get<FirmaSettings>(`${this.basis}/settings/${schluessel}`);
  }
  einstellungenSpeichern(schluessel: SettingsKey, daten: Partial<FirmaSettings>): Observable<FirmaSettings> {
    return this.http.post<FirmaSettings>(`${this.basis}/settings/${schluessel}`, daten);
  }

  // ── Benachrichtigungen ──────────────────────────────────────────────────
  benachrichtigungenLaden(): Observable<Benachrichtigung[]> {
    return this.http.get<Benachrichtigung[]>(`${this.basis}/benachrichtigungen`);
  }
  alleBenachrichtigungenAlsGelesenMarkieren(): Observable<void> {
    return this.http.post<void>(`${this.basis}/benachrichtigungen/alle-lesen`, {});
  }
  benachrichtigungAlsGelesenMarkieren(id: number): Observable<void> {
    return this.http.post<void>(`${this.basis}/benachrichtigungen/${id}/lesen`, {});
  }

  // ── Audit-Log ───────────────────────────────────────────────────────────
  auditLogAllesLaden(): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${this.basis}/audit/all`);
  }
  auditLogFuerTabelleLaden(tabelle: string): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${this.basis}/audit/${tabelle}/all`);
  }
  auditLogFuerDatensatzLaden(tabelle: string, id: number): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${this.basis}/audit/${tabelle}/${id}`);
  }

  // ── DATEV ────────────────────────────────────────────────────────────────
  datevValidieren(jahr: number, monat: number): Observable<DatevValidation> {
    const params = new HttpParams().set('jahr', jahr).set('monat', monat);
    return this.http.get<DatevValidation>(`${this.basis}/datev/validate`, { params });
  }
  datevVorschauLaden(jahr: number, monat: number): Observable<DatevPreviewRow[]> {
    const params = new HttpParams().set('jahr', jahr).set('monat', monat);
    return this.http.get<DatevPreviewRow[]>(`${this.basis}/datev/preview`, { params });
  }
  datevExportUrl(jahr: number, monat: number): string {
    return `${this.basis}/datev/export?jahr=${jahr}&monat=${monat}`;
  }
  datevExcelUrl(jahr: number, monat: number): string {
    return `${this.basis}/datev/excel?jahr=${jahr}&monat=${monat}`;
  }

  // ── Wiederkehrende Ausgaben ─────────────────────────────────────────────
  wiederkehrendeAusgabenLaden(): Observable<WiederkehrendeAusgabe[]> {
    return this.http.get<WiederkehrendeAusgabe[]>(`${this.basis}/wiederkehrend`);
  }
  wiederkehrendeAusgabeErstellen(daten: Partial<WiederkehrendeAusgabe>): Observable<WiederkehrendeAusgabe> {
    return this.http.post<WiederkehrendeAusgabe>(`${this.basis}/wiederkehrend`, daten);
  }
  wiederkehrendeAusgabeAktualisieren(id: number, daten: Partial<WiederkehrendeAusgabe>): Observable<WiederkehrendeAusgabe> {
    return this.http.put<WiederkehrendeAusgabe>(`${this.basis}/wiederkehrend/${id}`, daten);
  }
  wiederkehrendeAusgabeLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/wiederkehrend/${id}`);
  }

  // ── Wiederkehrende Rechnungen ───────────────────────────────────────────
  wiederkehrendeRechnungenLaden(): Observable<WiederkehrendeRechnung[]> {
    return this.http.get<WiederkehrendeRechnung[]>(`${this.basis}/wiederkehrend-rechnungen`);
  }
  wiederkehrendeRechnungErstellen(daten: Partial<WiederkehrendeRechnung>): Observable<WiederkehrendeRechnung> {
    return this.http.post<WiederkehrendeRechnung>(`${this.basis}/wiederkehrend-rechnungen`, daten);
  }
  wiederkehrendeRechnungAktualisieren(id: number, daten: Partial<WiederkehrendeRechnung>): Observable<WiederkehrendeRechnung> {
    return this.http.put<WiederkehrendeRechnung>(`${this.basis}/wiederkehrend-rechnungen/${id}`, daten);
  }
  wiederkehrendeRechnungLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/wiederkehrend-rechnungen/${id}`);
  }

  // ── Mahnungen ───────────────────────────────────────────────────────────
  mahnungenLaden(rechnungId: number): Observable<Mahnung[]> {
    return this.http.get<Mahnung[]>(`${this.basis}/mahnungen/${rechnungId}`);
  }
  mahnungErstellen(daten: Partial<Mahnung>): Observable<Mahnung> {
    return this.http.post<Mahnung>(`${this.basis}/mahnungen`, daten);
  }
  mahnungLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basis}/mahnungen/${id}`);
  }

  // ── PDF (JSON-basiert — Backend rendert mit Handlebars) ──────────────────
  rechnungPdfErstellen(rechnungId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.basis}/pdf/rechnung`, { rechnung_id: rechnungId });
  }
  angebotPdfErstellen(angebotId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.basis}/pdf/angebot`, { angebot_id: angebotId });
  }
  euerPdfErstellen(jahr: number, ergebnis: Record<string, unknown>): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.basis}/pdf/euer`, { jahr, ergebnis });
  }
  hausmeisterEinsatzPdfErstellen(einsatzId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.basis}/pdf/hausmeister/einsatz`, { einsatz_id: einsatzId });
  }
  hausmeisterMonatsnachweisPdfErstellen(monat: string, mitarbeiterName?: string): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.basis}/pdf/hausmeister/monat`, { monat, mitarbeiter_name: mitarbeiterName });
  }
  mitarbeiterAbrechnungPdfErstellen(mitarbeiterId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.basis}/pdf/mitarbeiter/abrechnung`, { mitarbeiter_id: mitarbeiterId });
  }
  pdfArchivLaden(): Observable<PdfArchiveEntry[]> {
    return this.http.get<PdfArchiveEntry[]>(`${this.basis}/pdf/archiv`);
  }

  // ── Backup ──────────────────────────────────────────────────────────────
  backupErstellen(): Observable<BackupInfo> {
    return this.http.post<BackupInfo>(`${this.basis}/backup`, {});
  }
  letztesBackupLaden(): Observable<BackupInfo> {
    return this.http.get<BackupInfo>(`${this.basis}/backup/last`);
  }
  backupDateienLaden(): Observable<BackupInfo[]> {
    return this.http.get<BackupInfo[]>(`${this.basis}/backup/files`);
  }
}
