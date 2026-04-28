import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomersApiClient, InvoicesApiClient, SettingsApiClient } from '../../core/api/clients';

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
  private readonly settingsApi = inject(SettingsApiClient);
  private readonly customersApi = inject(CustomersApiClient);
  private readonly invoicesApi = inject(InvoicesApiClient);

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
    this.settingsApi.loadSettings('firma').subscribe({
      next: (f) => {
        if (f && Object.keys(f).length > 0) this.schritte.update((s) => ({ ...s, firma: true }));
      },
      error: () => {},
    });
    this.customersApi.loadCustomers().subscribe({
      next: (k) => {
        if (k?.length > 0) this.schritte.update((s) => ({ ...s, kunde: true }));
      },
      error: () => {},
    });
    this.invoicesApi.loadInvoices().subscribe({
      next: (r) => {
        if (r?.length > 0) this.schritte.update((s) => ({ ...s, rechnung: true }));
      },
      error: () => {},
    });
  }

  protected schliessen(): void {
    localStorage.setItem(STORAGE_KEY, '1');
    this.sichtbar.set(false);
  }
}
