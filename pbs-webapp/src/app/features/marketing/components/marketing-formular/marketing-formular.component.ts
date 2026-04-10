import { ChangeDetectionStrategy, Component, input, output, linkedSignal } from '@angular/core';
import { FormField, form, required, email } from '@angular/forms/signals';
import { MarketingKontakt } from '../../../../core/models';
import { MarketingFormularDaten } from '../../marketing.models';

@Component({
  selector: 'app-marketing-formular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  templateUrl: './marketing-formular.component.html',
  styleUrl: './marketing-formular.component.scss',
})
export class MarketingFormularComponent {
  readonly formularDaten = input.required<MarketingFormularDaten>();
  readonly bearbeiteterKontakt = input<MarketingKontakt | null>(null);

  readonly gespeichert = output<void>();
  readonly abgebrochen = output<void>();
  readonly feldGeaendert = output<{ feld: keyof MarketingFormularDaten; wert: string }>();

  protected readonly formModell = linkedSignal(() => this.formularDaten());

  protected readonly marketingForm = form(this.formModell, (schema) => {
    required(schema.name, { message: 'Name ist erforderlich' });
    email(schema.email, { message: 'Gültige E-Mail eingeben' });
  });

  protected onFeld(feld: keyof MarketingFormularDaten, event: Event): void {
    const wert = (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
    this.feldGeaendert.emit({ feld, wert });
  }
}
