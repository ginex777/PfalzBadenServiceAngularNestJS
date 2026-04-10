import { ChangeDetectionStrategy, Component, input, output, OnChanges, SimpleChanges, signal, linkedSignal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { Kunde } from '../../../../core/models';
import { KundenFormularDaten, LEERES_FORMULAR } from '../../kunden.models';

@Component({
  selector: 'app-kunden-formular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  templateUrl: './kunden-formular.component.html',
  styleUrl: './kunden-formular.component.scss',
})
export class KundenFormularComponent implements OnChanges {
  readonly bearbeiteterKunde = input<Kunde | null>(null);
  readonly gespeichert = output<KundenFormularDaten>();
  readonly abgebrochen = output<void>();

  protected readonly formModell = signal<KundenFormularDaten>({ ...LEERES_FORMULAR });

  protected readonly kundenForm = form(this.formModell, (schema) => {
    required(schema.name, { message: 'Name ist erforderlich' });
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bearbeiteterKunde']) {
      const kunde = this.bearbeiteterKunde();
      this.formModell.set(kunde ? {
        name: kunde.name,
        strasse: kunde.strasse ?? '',
        ort: kunde.ort ?? '',
        tel: kunde.tel ?? '',
        email: kunde.email ?? '',
        notiz: kunde.notiz ?? '',
      } : { ...LEERES_FORMULAR });
    }
  }

  protected speichern(): void {
    if (this.kundenForm().invalid()) return;
    const daten = this.formModell();
    this.gespeichert.emit({ ...daten, name: daten.name.trim() });
    this.formModell.set({ ...LEERES_FORMULAR });
  }

  protected abbrechen(): void {
    this.formModell.set({ ...LEERES_FORMULAR });
    this.abgebrochen.emit();
  }

  protected get titelText(): string {
    return this.bearbeiteterKunde() ? `Kunde bearbeiten: ${this.bearbeiteterKunde()!.name}` : 'Neuer Kunde';
  }

  protected get submitLabel(): string {
    return this.bearbeiteterKunde() ? 'Änderungen speichern' : 'Kunde anlegen';
  }
}
