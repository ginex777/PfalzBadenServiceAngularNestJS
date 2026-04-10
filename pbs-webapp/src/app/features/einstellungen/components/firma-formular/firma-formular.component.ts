import { ChangeDetectionStrategy, Component, input, output, linkedSignal } from '@angular/core';
import { FirmaSettings } from '../../../../core/models';

@Component({
  selector: 'app-firma-formular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './firma-formular.component.html',
  styleUrl: './firma-formular.component.scss',
})
export class FirmaFormularComponent {
  readonly firma = input.required<FirmaSettings>();
  readonly speichert = input<boolean>(false);
  readonly erfolg = input<string | null>(null);
  readonly fehler = input<string | null>(null);
  readonly speichern = output<void>();
  readonly feldAktualisieren = output<{ feld: keyof FirmaSettings; wert: string }>();

  protected feldGeaendert(feld: keyof FirmaSettings, event: Event): void {
    this.feldAktualisieren.emit({ feld, wert: (event.target as HTMLInputElement).value });
  }
}
