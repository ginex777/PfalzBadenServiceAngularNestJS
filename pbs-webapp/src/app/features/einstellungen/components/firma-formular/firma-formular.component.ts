import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { FirmaSettings } from '../../../../core/models';

@Component({
  selector: 'app-firma-formular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './firma-formular.component.html',
  styleUrl: './firma-formular.component.scss',
})
export class FirmaFormularComponent {
  readonly company = input.required<FirmaSettings>();
  readonly saving = input<boolean>(false);
  readonly success = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly save = output<void>();
  readonly updateField = output<{ field: keyof FirmaSettings; value: string }>();

  protected feldGeaendert(feld: keyof FirmaSettings, event: Event): void {
    this.updateField.emit({ field: feld, value: (event.target as HTMLInputElement).value });
  }
}
