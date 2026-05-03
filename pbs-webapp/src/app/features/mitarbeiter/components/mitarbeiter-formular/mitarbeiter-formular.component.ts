import type {
  OnChanges,
  SimpleChanges} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import type { Mitarbeiter } from '../../../../core/models';
import type { MitarbeiterFormularDaten} from '../../mitarbeiter.models';
import { LEERES_MITARBEITER_FORMULAR } from '../../mitarbeiter.models';

@Component({
  selector: 'app-mitarbeiter-formular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  templateUrl: './mitarbeiter-formular.component.html',
})
export class MitarbeiterFormularComponent implements OnChanges {
  readonly bearbeiteterMitarbeiter = input<Mitarbeiter | null>(null);
  readonly gespeichert = output<MitarbeiterFormularDaten>();
  readonly abgebrochen = output<void>();

  protected readonly formModell = signal<MitarbeiterFormularDaten>({ ...LEERES_MITARBEITER_FORMULAR });

  protected readonly mitarbeiterForm = form(this.formModell, (schema) => {
    required(schema.name, { message: 'Name ist erforderlich' });
  });

  protected readonly istGueltig = computed(() => !!this.formModell().name?.trim());

  protected stundenlohnGeaendert(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    const hourlyRate = parseFloat(target.value) || 0;
    this.formModell.update((f) => ({ ...f, stundenlohn: Math.max(0, hourlyRate) }));
  }

  protected aktivGeaendert(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.formModell.update((f) => ({ ...f, aktiv: target.checked }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bearbeiteterMitarbeiter']) {
      const ma = this.bearbeiteterMitarbeiter();
      this.formModell.set(
        ma
          ? {
              name: ma.name,
              rolle: ma.rolle ?? '',
              stundenlohn: ma.stundenlohn,
              email: ma.email ?? '',
              tel: ma.tel ?? '',
              notiz: ma.notiz ?? '',
              aktiv: ma.aktiv,
            }
          : { ...LEERES_MITARBEITER_FORMULAR },
      );
    }
  }

  protected speichern(): void {
    if (!this.istGueltig()) return;
    this.gespeichert.emit({ ...this.formModell() });
  }

  protected abbrechen(): void {
    this.formModell.set({ ...LEERES_MITARBEITER_FORMULAR });
    this.abgebrochen.emit();
  }
}
