import { Injectable, inject, signal } from '@angular/core';
import { EinstellungenService } from './einstellungen.service';
import { FirmaSettings } from '../../core/models';

interface SmtpSettings { host: string; port: number; secure: boolean; user: string; pass: string; fromName?: string; }

@Injectable({ providedIn: 'root' })
export class EinstellungenFacade {
  private readonly service = inject(EinstellungenService);

  readonly laedt = signal(false);
  readonly speichert = signal(false);
  readonly fehler = signal<string | null>(null);
  readonly erfolg = signal<string | null>(null);
  readonly firma = signal<FirmaSettings>({});
  readonly backupLaedt = signal(false);
  readonly letztesBackup = signal<string | null>(null);
  readonly backupDateien = signal<string[]>([]);
  readonly smtp = signal<SmtpSettings>({ host: '', port: 587, secure: false, user: '', pass: '', fromName: '' });
  readonly smtpSpeichert = signal(false);
  readonly smtpTestLaedt = signal(false);
  readonly smtpErfolg = signal<string | null>(null);

  ladeDaten(): void {
    this.laedt.set(true);
    this.service.firmaLaden().subscribe({
      next: f => { this.firma.set(f); this.laedt.set(false); },
      error: () => { this.fehler.set('Einstellungen konnten nicht geladen werden.'); this.laedt.set(false); },
    });
    this.service.smtpLaden().subscribe({
      next: (s: unknown) => { if (s && typeof s === 'object') this.smtp.set(s as SmtpSettings); },
      error: () => {},
    });
    this.backupStatusLaden();
  }

  firmaSpeichern(): void {
    this.speichert.set(true);
    this.fehler.set(null);
    this.erfolg.set(null);
    this.service.firmaSpeichern(this.firma()).subscribe({
      next: () => {
        this.speichert.set(false);
        this.erfolg.set('✓ Gespeichert — PDFs verwenden ab sofort diese Daten');
        setTimeout(() => this.erfolg.set(null), 4000);
      },
      error: () => { this.fehler.set('Einstellungen konnten nicht gespeichert werden.'); this.speichert.set(false); },
    });
  }

  firmaFeldAktualisieren<K extends keyof FirmaSettings>(feld: K, wert: FirmaSettings[K]): void {
    this.firma.update(f => ({ ...f, [feld]: wert }));
  }

  smtpFeldAktualisieren(feld: keyof SmtpSettings, wert: string | number | boolean): void {
    this.smtp.update(s => ({ ...s, [feld]: wert }));
  }

  smtpSpeichernAusfuehren(): void {
    this.smtpSpeichert.set(true);
    this.service.smtpSpeichern(this.smtp()).subscribe({
      next: () => {
        this.smtpSpeichert.set(false);
        this.smtpErfolg.set('✓ SMTP gespeichert');
        setTimeout(() => this.smtpErfolg.set(null), 3000);
      },
      error: () => { this.fehler.set('SMTP konnte nicht gespeichert werden.'); this.smtpSpeichert.set(false); },
    });
  }

  smtpTesten(): void {
    this.smtpTestLaedt.set(true);
    this.service.smtpTesten().subscribe({
      next: () => { this.smtpTestLaedt.set(false); this.smtpErfolg.set('✓ SMTP Verbindung erfolgreich'); setTimeout(() => this.smtpErfolg.set(null), 3000); },
      error: (e: Error) => { this.smtpTestLaedt.set(false); this.fehler.set('SMTP-Test fehlgeschlagen: ' + e.message); },
    });
  }

  backupErstellen(): void {
    this.backupLaedt.set(true);
    this.service.backupErstellen().subscribe({
      next: () => { this.backupLaedt.set(false); this.erfolg.set('Backup erstellt ✓'); this.backupStatusLaden(); setTimeout(() => this.erfolg.set(null), 3000); },
      error: () => { this.fehler.set('Backup fehlgeschlagen.'); this.backupLaedt.set(false); },
    });
  }

  private backupStatusLaden(): void {
    this.service.letztesBackupLaden().subscribe({
      next: (info: unknown) => {
        const data = info as { lastBackupTime?: string };
        this.letztesBackup.set(data?.lastBackupTime ?? null);
      },
      error: () => {},
    });
    this.service.backupDateienLaden().subscribe({
      next: (info: unknown) => {
        const data = info as { files?: string[] };
        this.backupDateien.set(data?.files ?? []);
      },
      error: () => {},
    });
  }
}
