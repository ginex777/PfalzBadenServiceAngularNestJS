import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

export interface UserEintrag {
  id: string;
  email: string;
  rolle: string;
  vorname: string | null;
  nachname: string | null;
  aktiv: boolean;
  created_at: string;
}

@Component({
  selector: 'app-benutzerverwaltung',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './benutzerverwaltung.component.html',
  styleUrl: './benutzerverwaltung.component.scss',
})
export class BenutzerverwaltungComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly users = signal<UserEintrag[]>([]);
  readonly laedt = signal(false);
  readonly erfolg = signal<string | null>(null);
  readonly fehler = signal<string | null>(null);

  readonly neuerUser = signal({ email: '', password: '', rolle: 'readonly' as string, vorname: '', nachname: '' });
  readonly anlegenLaedt = signal(false);

  readonly bearbeiteterUser = signal<UserEintrag | null>(null);
  readonly bearbeitenForm = signal({ vorname: '', nachname: '', rolle: '' });

  ngOnInit(): void { this._laden(); }

  private _laden(): void {
    this.laedt.set(true);
    this.http.get<UserEintrag[]>('/api/auth/users').subscribe({
      next: list => { this.users.set(list); this.laedt.set(false); },
      error: () => this.laedt.set(false),
    });
  }

  anlegen(): void {
    const p = this.neuerUser();
    if (!p.email || !p.password) { this.fehler.set('E-Mail und Passwort sind Pflichtfelder.'); return; }
    this.anlegenLaedt.set(true);
    this.fehler.set(null);
    this.http.post<UserEintrag>('/api/auth/users', p).subscribe({
      next: user => {
        this.users.update(l => [...l, user]);
        this.neuerUser.set({ email: '', password: '', rolle: 'readonly', vorname: '', nachname: '' });
        this.anlegenLaedt.set(false);
        this._toast(`✓ ${user.email} angelegt`);
      },
      error: (e: { error?: { message?: string } }) => {
        this.anlegenLaedt.set(false);
        this.fehler.set(e?.error?.message ?? 'Fehler beim Anlegen.');
      },
    });
  }

  bearbeitenOeffnen(u: UserEintrag): void {
    this.bearbeiteterUser.set(u);
    this.bearbeitenForm.set({ vorname: u.vorname ?? '', nachname: u.nachname ?? '', rolle: u.rolle });
  }

  bearbeitenSpeichern(): void {
    const u = this.bearbeiteterUser();
    if (!u) return;
    this.http.patch<UserEintrag>(`/api/auth/users/${u.id}`, this.bearbeitenForm()).subscribe({
      next: updated => {
        this.users.update(l => l.map(x => x.id === updated.id ? updated : x));
        this.bearbeiteterUser.set(null);
        this._toast('✓ Benutzer aktualisiert');
      },
      error: () => this.fehler.set('Fehler beim Speichern.'),
    });
  }

  loeschen(u: UserEintrag): void {
    if (!confirm(`Benutzer "${u.email}" wirklich löschen?`)) return;
    this.http.delete(`/api/auth/users/${u.id}`).subscribe({
      next: () => {
        this.users.update(l => l.filter(x => x.id !== u.id));
        this._toast('✓ Benutzer gelöscht');
      },
      error: (e: { error?: { message?: string } }) => this.fehler.set(e?.error?.message ?? 'Fehler beim Löschen.'),
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
