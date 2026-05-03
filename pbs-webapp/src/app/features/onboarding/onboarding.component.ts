import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomersApiClient, InvoicesApiClient, SettingsApiClient } from '../../core/api/clients';

const STORAGE_KEY = 'pbs-onboarding-erledigt';
const SESSION_KEY = 'pbs-onboarding-session-dismissed';

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

  protected readonly visible = signal(
    !localStorage.getItem(STORAGE_KEY) && !sessionStorage.getItem(SESSION_KEY),
  );

  protected readonly steps = signal({
    company: false,
    customer: false,
    invoice: false,
  });

  protected readonly allDone = computed(() => {
    const currentSteps = this.steps();
    return currentSteps.company && currentSteps.customer && currentSteps.invoice;
  });

  constructor() {
    if (this.visible()) {
      this.checkProgress();
    }
  }

  private checkProgress(): void {
    this.settingsApi.loadSettings('firma').subscribe({
      next: (f) => {
        if (f && Object.keys(f).length > 0) this.steps.update((s) => ({ ...s, company: true }));
      },
      error: () => {},
    });
    this.customersApi.loadCustomers().subscribe({
      next: (k) => {
        if (k?.length > 0) this.steps.update((s) => ({ ...s, customer: true }));
      },
      error: () => {},
    });
    this.invoicesApi.loadInvoices().subscribe({
      next: (r) => {
        if (r?.length > 0) this.steps.update((s) => ({ ...s, invoice: true }));
      },
      error: () => {},
    });
  }

  protected close(): void {
    if (this.allDone()) {
      localStorage.setItem(STORAGE_KEY, '1');
    } else {
      sessionStorage.setItem(SESSION_KEY, '1');
    }
    this.visible.set(false);
  }
}
