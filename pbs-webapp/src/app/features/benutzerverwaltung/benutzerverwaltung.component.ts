import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EinstellungenService, UserEintrag } from '../einstellungen/einstellungen.service';
import { ToastService } from '../../core/services/toast.service';
import { BenutzerFormularComponent } from './components/benutzer-formular/benutzer-formular.component';
import { BenutzerNeuDaten, BenutzerBearbeitenDaten } from './benutzerverwaltung.models';

export type { UserEintrag };

@Component({
  selector: 'app-benutzerverwaltung',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BenutzerFormularComponent, DatePipe],
  templateUrl: './benutzerverwaltung.component.html',
  styleUrl: './benutzerverwaltung.component.scss',
})
export class BenutzerverwaltungComponent implements OnInit {
  private readonly einstellungen = inject(EinstellungenService);
  private readonly toast = inject(ToastService);

  readonly users = signal<UserEintrag[]>([]);
  readonly laedt = signal(false);
  readonly anlegenLaedt = signal(false);
  readonly erfolg = signal<string | null>(null);
  readonly neuerUserSichtbar = signal(false);
  readonly bearbeiteterUser = signal<UserEintrag | null>(null);

  ngOnInit(): void {
    this._laden();
  }

  private _laden(): void {
    this.laedt.set(true);
    this.einstellungen.userListeLaden().subscribe({
      next: (list) => { this.users.set(list); this.laedt.set(false); },
      error: () => this.laedt.set(false),
    });
  }

  neuerUserOeffnen(): void {
    this.neuerUserSichtbar.set(true);
  }

  neuerUserSchliessen(): void {
    this.neuerUserSichtbar.set(false);
  }

  bearbeitenOeffnen(u: UserEintrag): void {
    this.bearbeiteterUser.set(u);
  }

  bearbeitenSchliessen(): void {
    this.bearbeiteterUser.set(null);
  }

  anlegen(daten: BenutzerNeuDaten): void {
    this.anlegenLaedt.set(true);
    this.einstellungen
      .createUser({
        email: daten.email,
        password: daten.password,
        rolle: daten.rolle as 'admin' | 'readonly' | 'mitarbeiter',
        vorname: daten.vorname,
        nachname: daten.nachname,
      })
      .subscribe({
        next: (user) => {
          this.users.update((l) => [...l, user]);
          this.anlegenLaedt.set(false);
          this.neuerUserSichtbar.set(false);
          this._toast(`✓ ${user.email} angelegt`);
        },
        error: (e: { error?: { message?: string } }) => {
          this.anlegenLaedt.set(false);
          this.toast.error(e?.error?.message ?? 'Fehler beim Anlegen.');
        },
      });
  }

  bearbeitenSpeichern(daten: BenutzerBearbeitenDaten): void {
    const u = this.bearbeiteterUser();
    if (!u) return;
    this.einstellungen.updateUser(u.id, daten).subscribe({
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
