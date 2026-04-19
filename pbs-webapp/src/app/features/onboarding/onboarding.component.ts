import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';

const STORAGE_KEY = 'pbs-onboarding-erledigt';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent {
  private readonly api = inject(ApiService);

  protected readonly sichtbar = signal(!localStorage.getItem(STORAGE_KEY));

  protected readonly schritte = signal({
    firma: false,
    kunde: false,
    rechnung: false,
  });

  protected readonly alleErledigt = computed(() => {
    const s = this.schritte();
    return s.firma && s.kunde && s.rechnung;
  });

  constructor() {
    if (this.sichtbar()) {
      this.fortschrittPruefen();
    }
  }

  private fortschrittPruefen(): void {
    this.api.einstellungenLaden('firma').subscribe({
      next: (f) => {
        if (f && Object.keys(f).length > 0) this.schritte.update(s => ({ ...s, firma: true }));
      },
      error: () => {},
    });
    this.api.kundenLaden().subscribe({
      next: (k) => {
        if (k?.length > 0) this.schritte.update(s => ({ ...s, kunde: true }));
      },
      error: () => {},
    });
    this.api.rechnungenLaden().subscribe({
      next: (r) => {
        if (r?.length > 0) this.schritte.update(s => ({ ...s, rechnung: true }));
      },
      error: () => {},
    });
  }

  protected schliessen(): void {
    localStorage.setItem(STORAGE_KEY, '1');
    this.sichtbar.set(false);
  }
}
