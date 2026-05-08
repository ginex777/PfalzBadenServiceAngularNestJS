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
import type { Kunde } from '../../../../core/models';
import type { KundenFormularDaten} from '../../kunden.models';
import { LEERES_FORMULAR } from '../../kunden.models';

@Component({
  selector: 'app-kunden-formular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  templateUrl: './kunden-formular.component.html',
  styleUrl: './kunden-formular.component.scss',
})
export class KundenFormularComponent implements OnChanges {
  readonly editingCustomer = input<Kunde | null>(null);
  readonly saved = output<KundenFormularDaten>();
  readonly cancelled = output<void>();
  readonly changed = output<void>();

  protected readonly formModell = signal<KundenFormularDaten>({ ...LEERES_FORMULAR });

  protected readonly kundenForm = form(this.formModell, (schema) => {
    required(schema.name, { message: 'Name ist erforderlich' });
    required(schema.strasse, { message: 'Straße ist erforderlich' });
    required(schema.ort, { message: 'PLZ Ort ist erforderlich' });
    required(schema.tel, { message: 'Telefon ist erforderlich' });
    required(schema.email, { message: 'E-Mail ist erforderlich' });
  });

  protected readonly istFormularGueltig = computed(() => {
    const daten = this.formModell();
    const emailValid = !daten.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(daten.email);
    return !!(daten.name?.trim() && emailValid);
  });

  protected readonly validierungsFehler = computed(() => {
    const daten = this.formModell();
    const errors: string[] = [];

    if (!daten.name?.trim()) errors.push('Name ist erforderlich');

    if (daten.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(daten.email)) {
      errors.push('E-Mail-Adresse ist ungültig');
    }

    return errors;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingCustomer']) {
      const kunde = this.editingCustomer();
      this.formModell.set(
        kunde
          ? {
              name: kunde.name,
              strasse: kunde.strasse ?? '',
              ort: kunde.ort ?? '',
              tel: kunde.tel ?? '',
              email: kunde.email ?? '',
              notiz: kunde.notiz ?? '',
            }
          : { ...LEERES_FORMULAR },
      );
    }
  }

  protected speichern(): void {
    if (!this.istFormularGueltig()) return;
    const daten = this.formModell();
    this.saved.emit({ ...daten, name: daten.name.trim() });
    this.formModell.set({ ...LEERES_FORMULAR });
  }

  protected onFeldGeaendert(): void {
    this.changed.emit();
  }

  protected abbrechen(): void {
    this.formModell.set({ ...LEERES_FORMULAR });
    this.cancelled.emit();
  }

  protected get titelText(): string {
    const kunde = this.editingCustomer();
    return kunde ? `Kunde bearbeiten: ${kunde.name}` : 'Neuer Kunde';
  }

  protected get submitLabel(): string {
    return this.editingCustomer() ? 'Änderungen speichern' : 'Kunde anlegen';
  }
}
