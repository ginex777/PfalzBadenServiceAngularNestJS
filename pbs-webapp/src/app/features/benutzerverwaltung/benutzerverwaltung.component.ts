import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { EinstellungenService, UserEintrag } from '../einstellungen/einstellungen.service';
import { ToastService } from '../../core/services/toast.service';

export type { UserEintrag };

@Component({
  selector: 'app-benutzerverwaltung',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './benutzerverwaltung.component.html',
  styleUrl: './benutzerverwaltung.component.scss',
})
export class BenutzerverwaltungComponent implements OnInit {
  private readonly einstellungen = inject(EinstellungenService);
  private readonly toast = inject(ToastService);

  readonly users = signal<UserEintrag[]>([]);
  readonly laedt = signal(false);
  readonly erfolg = signal<string | null>(null);

  readonly neuerUser = signal({
    email: '',
    password: '',
    rolle: 'readonly' as string,
    vorname: '',
    nachname: '',
  });
  readonly anlegenLaedt = signal(false);

  readonly bearbeiteterUser = signal<UserEintrag | null>(null);
  readonly bearbeitenForm = signal({ vorname: '', nachname: '', rolle: '' });

  ngOnInit(): void {
    this._laden();
  }

  private _laden(): void {
    this.laedt.set(true);
    this.einstellungen.userListeLaden().subscribe({
      next: (list) => {
        this.users.set(list);
        this.laedt.set(false);
      },
      error: () => this.laedt.set(false),
    });
  }

  anlegen(): void {
    const p = this.neuerUser();
    if (!p.email || !p.password) {
      this.toast.error('E-Mail und Passwort sind Pflichtfelder.');
      return;
    }
    this.anlegenLaedt.set(true);
    this.einstellungen
      .createUser({
        email: p.email,
        password: p.password,
        rolle: p.rolle as 'admin' | 'readonly' | 'mitarbeiter',
        vorname: p.vorname,
        nachname: p.nachname,
      })
      .subscribe({
        next: (user) => {
          this.users.update((l) => [...l, user]);
          this.neuerUser.set({
            email: '',
            password: '',
            rolle: 'readonly',
            vorname: '',
            nachname: '',
          });
          this.anlegenLaedt.set(false);
          this._toast(`✓ ${user.email} angelegt`);
        },
        error: (e: { error?: { message?: string } }) => {
          this.anlegenLaedt.set(false);
          this.toast.error(e?.error?.message ?? 'Fehler beim Anlegen.');
        },
      });
  }

  bearbeitenOeffnen(u: UserEintrag): void {
    this.bearbeiteterUser.set(u);
    this.bearbeitenForm.set({
      vorname: u.vorname ?? '',
      nachname: u.nachname ?? '',
      rolle: u.rolle,
    });
  }

  bearbeitenSpeichern(): void {
    const u = this.bearbeiteterUser();
    if (!u) return;
    this.einstellungen.updateUser(u.id, this.bearbeitenForm()).subscribe({
      next: (updated) => {
        this.users.update((l) => l.map((x) => (x.id === updated.id ? updated : x)));
        this.bearbeiteterUser.set(null);
        this._toast('✓ Benutzer aktualisiert');
      },
      error: () => this.toast.error('Fehler beim Speichern.'),
    });
  }

  loeschen(u: UserEintrag): void {
    if (!confirm(`Benutzer "${u.email}" wirklich löschen?`)) return;
    this.einstellungen.deleteUser(u.id).subscribe({
      next: () => {
        this.users.update((l) => l.filter((x) => x.id !== u.id));
        this._toast('✓ Benutzer gelöscht');
      },
      error: (e: { error?: { message?: string } }) =>
        this.toast.error(e?.error?.message ?? 'Fehler beim Löschen.'),
    });
  }

  vollName(u: UserEintrag): string {
    if (u.vorname || u.nachname) return [u.vorname, u.nachname].filter(Boolean).join(' ');
    return '–';
  }

  private _toast(msg: string): void {
    this.erfolg.set(msg);
    setTimeout(() => this.erfolg.set(null), 4000);
  }
}
