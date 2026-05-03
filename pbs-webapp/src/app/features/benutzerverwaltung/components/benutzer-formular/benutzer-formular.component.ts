import type {
  OnChanges,
  SimpleChanges} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import type { UserEintrag } from '../../benutzerverwaltung.component';
import type {
  BenutzerBearbeitenDaten,
  BenutzerNeuDaten} from '../../benutzerverwaltung.models';
import {
  LEERER_BENUTZER,
  LEERES_BEARBEITEN_FORMULAR,
  ROLLEN_OPTIONEN,
} from '../../benutzerverwaltung.models';

@Component({
  selector: 'app-benutzer-formular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  templateUrl: './benutzer-formular.component.html',
})
export class BenutzerFormularComponent implements OnChanges {
  readonly editedUser = input<UserEintrag | null>(null);
  readonly isLoading = input(false);
  readonly created = output<BenutzerNeuDaten>();
  readonly updated = output<BenutzerBearbeitenDaten>();
  readonly canceled = output<void>();

  protected readonly rollenOptionen = ROLLEN_OPTIONEN;

  protected readonly neuModell = signal<BenutzerNeuDaten>({ ...LEERER_BENUTZER });
  protected readonly bearbeitenModell = signal<BenutzerBearbeitenDaten>({ ...LEERES_BEARBEITEN_FORMULAR });

  protected readonly neuForm = form(this.neuModell, (schema) => {
    required(schema.email, { message: 'E-Mail ist erforderlich' });
    required(schema.password, { message: 'Passwort ist erforderlich' });
    required(schema.rolle, { message: 'Rolle ist erforderlich' });
  });

  protected readonly bearbeitenForm = form(this.bearbeitenModell, (schema) => {
    required(schema.rolle, { message: 'Rolle ist erforderlich' });
  });

  protected readonly istBearbeiten = computed(() => this.editedUser() !== null);

  protected readonly neuGueltig = computed(() => {
    const d = this.neuModell();
    return !!d.email?.trim() && !!d.password && d.password.length >= 8;
  });

  protected readonly bearbeitenGueltig = computed(() => !!this.bearbeitenModell().rolle);

  protected neuRolleGeaendert(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    this.neuModell.update((f) => ({ ...f, rolle: target.value }));
  }

  protected bearbeitenRolleGeaendert(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    this.bearbeitenModell.update((f) => ({ ...f, rolle: target.value }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editedUser']) {
      const u = this.editedUser();
      if (u) {
        this.bearbeitenModell.set({ vorname: u.vorname ?? '', nachname: u.nachname ?? '', rolle: u.rolle });
      } else {
        this.neuModell.set({ ...LEERER_BENUTZER });
      }
    }
  }

  protected speichern(): void {
    if (this.istBearbeiten()) {
      if (!this.bearbeitenGueltig()) return;
      this.updated.emit({ ...this.bearbeitenModell() });
    } else {
      if (!this.neuGueltig()) return;
      this.created.emit({ ...this.neuModell() });
      this.neuModell.set({ ...LEERER_BENUTZER });
    }
  }

  protected abbrechen(): void {
    this.neuModell.set({ ...LEERER_BENUTZER });
    this.canceled.emit();
  }
}
