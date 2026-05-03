import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CustomersApiClient, InvoicesApiClient, SettingsApiClient } from '../../core/api/clients';
import { OnboardingComponent } from './onboarding.component';

describe('OnboardingComponent', () => {
  let fixture: ComponentFixture<OnboardingComponent>;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [OnboardingComponent],
      providers: [
        provideRouter([]),
        { provide: SettingsApiClient, useValue: { loadSettings: vi.fn(() => of({})) } },
        { provide: CustomersApiClient, useValue: { loadCustomers: vi.fn(() => of([])) } },
        { provide: InvoicesApiClient, useValue: { loadInvoices: vi.fn(() => of([])) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('closes through the native backdrop button and stores session dismissal', () => {
    const backdrop = fixture.nativeElement.querySelector(
      '.onboarding-backdrop',
    ) as HTMLButtonElement | null;

    expect(backdrop).not.toBeNull();
    backdrop?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.onboarding-overlay')).toBeNull();
    expect(sessionStorage.getItem('pbs-onboarding-session-dismissed')).toBe('1');
  });

  it('closes on Escape from the dialog', () => {
    const dialog = fixture.nativeElement.querySelector('.onboarding-modal') as HTMLElement | null;

    expect(dialog).not.toBeNull();
    dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.onboarding-overlay')).toBeNull();
  });
});
