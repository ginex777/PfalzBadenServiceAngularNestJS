import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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
  private readonly http = inject(HttpClient);

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
    this.http.get<{ firma?: string }>('/api/einstellungen/firma').subscribe({
      next: (f) => {
        if (f?.firma) this.schritte.update(s => ({ ...s, firma: true }));
      },
      error: () => {},
    });
    this.http.get<unknown[]>('/api/kunden').subscribe({
      next: (k) => {
        if (k?.length > 0) this.schritte.update(s => ({ ...s, kunde: true }));
      },
      error: () => {},
    });
    this.http.get<unknown[]>('/api/rechnungen').subscribe({
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
