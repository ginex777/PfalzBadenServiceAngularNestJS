import { computed, signal } from '@angular/core';
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Benachrichtigung } from '../../core/models';
import { DashboardFacade } from './dashboard.facade';
import { DashboardComponent } from './dashboard.component';
import type { DashboardInvoiceRow, DashboardOfferRow, DashboardStats } from './dashboard.models';

class DashboardFacadeStub {
  readonly isLoading = signal(false);
  readonly stats = signal<DashboardStats | null>(null);
  readonly overdueInvoices = signal<DashboardInvoiceRow[]>([]);
  readonly openOffers = signal<DashboardOfferRow[]>([]);
  readonly notifications = signal<Benachrichtigung[]>([]);
  readonly currentYear = signal(2026);

  readonly unreadNotificationsCount = computed(() => 0);
  readonly unreadNotifications = computed(() => [] as Benachrichtigung[]);

  loadData() {}
  markAllNotificationsRead() {}
  markNotificationRead() {}
  navigateToNewInvoice() {}
  navigateToNewOffer() {}
  navigateToInvoices() {}
  navigateToOffers() {}
  openInvoice() {}
  openOffer() {}
}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: DashboardFacade, useClass: DashboardFacadeStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
