import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import type { Benachrichtigung } from '../../core/models';
import { DashboardService } from './dashboard.service';
import type { DashboardInvoiceRow, DashboardOfferRow, DashboardStats } from './dashboard.models';
import { MS_PER_DAY } from '../../core/constants';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly service = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(false);
  readonly stats = signal<DashboardStats | null>(null);
  readonly overdueInvoices = signal<DashboardInvoiceRow[]>([]);
  readonly openOffers = signal<DashboardOfferRow[]>([]);
  readonly notifications = signal<Benachrichtigung[]>([]);
  readonly currentYear = signal(new Date().getFullYear());

  readonly unreadNotificationsCount = computed(
    () => this.notifications().filter((n) => !n.gelesen).length,
  );

  readonly unreadNotifications = computed(() =>
    this.notifications()
      .filter((n) => !n.gelesen)
      .slice(0, 8),
  );

  loadData(): void {
    this.isLoading.set(true);
    const year = this.currentYear();

    this.service.loadDashboardData(year).subscribe({
      next: (data) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const openInvoices = data.invoices.filter((invoice) => !invoice.bezahlt);
        const overdueInvoices = openInvoices
          .filter((invoice) => invoice.frist && new Date(invoice.frist) < today)
          .sort((a, b) => (a.frist ?? '').localeCompare(b.frist ?? ''));

        this.overdueInvoices.set(
          overdueInvoices.slice(0, 8).map((invoice) => ({
            id: invoice.id,
            number: invoice.nr,
            recipient: invoice.empf,
            gross: invoice.brutto,
            dueDate: invoice.frist,
            daysOverdue: invoice.frist
              ? Math.ceil((today.getTime() - new Date(invoice.frist).getTime()) / MS_PER_DAY)
              : null,
          })),
        );

        const openOffers = data.offers
          .filter((offer) => !offer.angenommen && !offer.abgelehnt)
          .map((offer) => {
            const daysRemaining =
              offer.gueltig_bis == null
                ? null
                : Math.ceil((new Date(offer.gueltig_bis).getTime() - today.getTime()) / MS_PER_DAY);

            return {
              id: offer.id,
              number: offer.nr,
              recipient: offer.empf,
              gross: offer.brutto,
              validUntil: offer.gueltig_bis,
              daysRemaining,
              isExpired: daysRemaining != null ? daysRemaining < 0 : false,
            } satisfies DashboardOfferRow;
          })
          .sort((a, b) => {
            const ad = a.validUntil ?? '9999-12-31';
            const bd = b.validUntil ?? '9999-12-31';
            return ad.localeCompare(bd);
          });

        this.openOffers.set(openOffers.slice(0, 8));

        this.stats.set({
          yearRevenueNet: data.yearlyStats.revenueNet,
          yearExpensesNet: data.yearlyStats.expensesNet,
          yearProfitNet: data.yearlyStats.profitNet,
          openInvoicesCount: openInvoices.length,
          openInvoicesGrossTotal: openInvoices.reduce(
            (sum, invoice) => sum + (invoice.brutto ?? 0),
            0,
          ),
          overdueInvoicesCount: overdueInvoices.length,
          overdueInvoicesGrossTotal: overdueInvoices.reduce(
            (sum, invoice) => sum + (invoice.brutto ?? 0),
            0,
          ),
          openOffersCount: openOffers.length,
          openOffersGrossTotal: openOffers.reduce((sum, offer) => sum + (offer.gross ?? 0), 0),
        });

        this.notifications.set(data.notifications);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Daten konnten nicht geladen werden.');
        this.isLoading.set(false);
      },
    });
  }

  markNotificationRead(id: number): void {
    this.service.markNotificationRead(id).subscribe(() => {
      this.notifications.update((list) =>
        list.map((n) => (n.id === id ? { ...n, gelesen: true } : n)),
      );
    });
  }

  markAllNotificationsRead(): void {
    this.service.markAllNotificationsRead().subscribe(() => {
      this.notifications.update((list) => list.map((n) => ({ ...n, gelesen: true })));
    });
  }

  navigateToInvoices(): void {
    this.router.navigate(['/rechnungen']);
  }

  openInvoice(id: number): void {
    this.router.navigate(['/finanzen/rechnungen'], { queryParams: { id } });
  }

  navigateToNewInvoice(): void {
    this.router.navigate(['/rechnungen'], { state: { neueRechnung: true } });
  }

  navigateToOffers(): void {
    this.router.navigate(['/angebote']);
  }

  openOffer(id: number): void {
    this.router.navigate(['/finanzen/angebote'], { queryParams: { id } });
  }

  navigateToNewOffer(): void {
    this.router.navigate(['/angebote'], { state: { neuesAngebot: true } });
  }

  navigateToAccounting(): void {
    this.router.navigate(['/finanzen/buchhaltung']);
  }
}
