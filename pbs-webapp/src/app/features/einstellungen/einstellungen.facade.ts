import { Injectable, inject, signal } from '@angular/core';
import { EinstellungenService, UserEintrag, UserAnlegenPayload } from './einstellungen.service';
import { ToastService } from '../../core/services/toast.service';
import { FirmaSettings } from '../../core/models';

interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName?: string;
}

@Injectable({ providedIn: 'root' })
export class EinstellungenFacade {
  private readonly service = inject(EinstellungenService);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly speichert = signal(false);
  readonly erfolg = signal<string | null>(null);
  readonly firma = signal<FirmaSettings>({});
  readonly backupLaedt = signal(false);
  readonly letztesBackup = signal<string | null>(null);
  readonly backupDateien = signal<string[]>([]);
  readonly smtp = signal<SmtpSettings>({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromName: '',
  });
  readonly smtpSpeichert = signal(false);
  readonly smtpTestLaedt = signal(false);
  readonly smtpErfolg = signal<string | null>(null);

  // Benutzerverwaltung
  readonly users = signal<UserEintrag[]>([]);
  readonly userLaedt = signal(false);
  readonly createUserLaedt = signal(false);
  readonly userErfolg = signal<string | null>(null);
  readonly userFehler = signal<string | null>(null);
  readonly neuerUser = signal<UserAnlegenPayload>({ email: '', password: '', rolle: 'readonly' });

  ladeDaten(): void {
    this.laedt.set(true);
    this.service.firmaLaden().subscribe({
      next: (f) => {
        this.firma.set(f);
        this.laedt.set(false);
      },
      error: () => {
        this.toast.error('Einstellungen konnten nicht geladen werden.');
        this.laedt.set(false);
      },
    });
    this.service.loadSmtp().subscribe({
      next: (s: unknown) => {
        if (s && typeof s === 'object') this.smtp.set(s as SmtpSettings);
      },
      error: () => {},
    });
    this.backupStatusLaden();
    this.userListeLaden();
  }

  userListeLaden(): void {
    this.userLaedt.set(true);
    this.service.userListeLaden().subscribe({
      next: (list) => {
        this.users.set(list);
        this.userLaedt.set(false);
      },
      error: () => {
        this.userLaedt.set(false);
      },
    });
  }

  neuerUserFeldSetzen(feld: keyof UserAnlegenPayload, wert: string): void {
    this.neuerUser.update((u) => ({ ...u, [feld]: wert }));
  }

  createUserAusfuehren(): void {
    const payload = this.neuerUser();
    if (!payload.email || !payload.password) {
      this.userFehler.set('E-Mail und Passwort sind Pflichtfelder.');
      return;
    }
    this.createUserLaedt.set(true);
    this.userFehler.set(null);
    this.userErfolg.set(null);
    this.service.createUser(payload).subscribe({
      next: (user) => {
        this.users.update((list) => [...list, user]);
        this.neuerUser.set({ email: '', password: '', rolle: 'readonly' });
        this.createUserLaedt.set(false);
        this.userErfolg.set(`✓ Benutzer ${user.email} wurde angelegt`);
        setTimeout(() => this.userErfolg.set(null), 4000);
      },
      error: (e: { error?: { message?: string } }) => {
        this.createUserLaedt.set(false);
        this.userFehler.set(e?.error?.message ?? 'Benutzer konnte nicht angelegt werden.');
      },
    });
  }

  firmaSpeichern(): void {
    this.speichert.set(true);
    this.erfolg.set(null);
    this.service.firmaSpeichern(this.firma()).subscribe({
      next: () => {
        this.speichert.set(false);
        this.erfolg.set('✓ Gespeichert — PDFs verwenden ab sofort diese Daten');
        setTimeout(() => this.erfolg.set(null), 4000);
      },
      error: () => {
        this.toast.error('Einstellungen konnten nicht gespeichert werden.');
        this.speichert.set(false);
      },
    });
  }

  firmaFeldAktualisieren<K extends keyof FirmaSettings>(feld: K, wert: FirmaSettings[K]): void {
    this.firma.update((f) => ({ ...f, [feld]: wert }));
  }

  smtpFeldAktualisieren(feld: keyof SmtpSettings, wert: string | number | boolean): void {
    this.smtp.update((s) => ({ ...s, [feld]: wert }));
  }

  saveSmtpAusfuehren(): void {
    this.smtpSpeichert.set(true);
    this.service.saveSmtp(this.smtp()).subscribe({
      next: () => {
        this.smtpSpeichert.set(false);
        this.smtpErfolg.set('✓ SMTP gespeichert');
        setTimeout(() => this.smtpErfolg.set(null), 3000);
      },
      error: () => {
        this.toast.error('SMTP konnte nicht gespeichert werden.');
        this.smtpSpeichert.set(false);
      },
    });
  }

  smtpTesten(): void {
    this.smtpTestLaedt.set(true);
    this.service.smtpTesten().subscribe({
      next: () => {
        this.smtpTestLaedt.set(false);
        this.smtpErfolg.set('✓ SMTP Verbindung erfolgreich');
        setTimeout(() => this.smtpErfolg.set(null), 3000);
      },
      error: (e: Error) => {
        this.smtpTestLaedt.set(false);
        this.toast.error('SMTP-Test fehlgeschlagen: ' + e.message);
      },
    });
  }

  createBackup(): void {
    this.backupLaedt.set(true);
    this.service.createBackup().subscribe({
      next: () => {
        this.backupLaedt.set(false);
        this.erfolg.set('Backup erstellt ✓');
        this.backupStatusLaden();
        setTimeout(() => this.erfolg.set(null), 3000);
      },
      error: () => {
        this.toast.error('Backup fehlgeschlagen.');
        this.backupLaedt.set(false);
      },
    });
  }

  private backupStatusLaden(): void {
    this.service.loadLastBackup().subscribe({
      next: (info: unknown) => {
        const data = info as { lastBackupTime?: string };
        this.letztesBackup.set(data?.lastBackupTime ?? null);
      },
      error: () => {},
    });
    this.service.loadBackupFiles().subscribe({
      next: (info: unknown) => {
        const data = info as { files?: string[] };
        this.backupDateien.set(data?.files ?? []);
      },
      error: () => {},
    });
  }
}
