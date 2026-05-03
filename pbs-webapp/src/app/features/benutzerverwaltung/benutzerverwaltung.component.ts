import type { OnInit} from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { UserEintrag } from '../einstellungen/einstellungen.service';
import { EinstellungenService } from '../einstellungen/einstellungen.service';
import { ToastService } from '../../core/services/toast.service';
import { BenutzerFormularComponent } from './components/benutzer-formular/benutzer-formular.component';
import type { BenutzerNeuDaten, BenutzerBearbeitenDaten } from './benutzerverwaltung.models';
import { ConfirmService } from '../../shared/services/confirm.service';
import { DrawerComponent } from '../../shared/ui/drawer/drawer.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';

export type { UserEintrag };

@Component({
  selector: 'app-benutzerverwaltung',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BenutzerFormularComponent, DatePipe, DrawerComponent, PageTitleComponent, StatusBadgeComponent],
  templateUrl: './benutzerverwaltung.component.html',
  styleUrl: './benutzerverwaltung.component.scss',
})
export class BenutzerverwaltungComponent implements OnInit {
  private readonly einstellungen = inject(EinstellungenService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly users = signal<UserEintrag[]>([]);
  readonly laedt = signal(false);
  readonly anlegenLaedt = signal(false);
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
          this.toast.success(`${user.email} angelegt`);
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
        this.toast.success('Benutzer aktualisiert');
      },
      error: () => this.toast.error('Fehler beim Speichern.'),
    });
  }

  async loeschen(u: UserEintrag): Promise<void> {
    const ok = await this.confirm.confirm({ message: `Benutzer "${u.email}" wirklich löschen?` });
    if (!ok) return;
    this.einstellungen.deleteUser(u.id).subscribe({
      next: () => {
        this.users.update((l) => l.filter((x) => x.id !== u.id));
        this.toast.success('Benutzer gelöscht');
      },
      error: (e: { error?: { message?: string } }) =>
        this.toast.error(e?.error?.message ?? 'Fehler beim Löschen.'),
    });
  }

  vollName(u: UserEintrag): string {
    if (u.vorname || u.nachname) return [u.vorname, u.nachname].filter(Boolean).join(' ');
    return '–';
  }

}
