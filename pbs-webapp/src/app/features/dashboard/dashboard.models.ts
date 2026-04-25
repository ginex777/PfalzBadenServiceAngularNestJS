// ============================================================
// Dashboard — Feature-spezifische Modelle
// ============================================================

export interface DashboardStats {
  yearRevenueNet: number;
  yearExpensesNet: number;
  yearProfitNet: number;
  openInvoicesCount: number;
  openInvoicesGrossTotal: number;
  overdueInvoicesCount: number;
  overdueInvoicesGrossTotal: number;
  openOffersCount: number;
  openOffersGrossTotal: number;
}

export interface DashboardInvoiceRow {
  id: number;
  number: string;
  recipient: string;
  gross: number;
  dueDate?: string;
  daysOverdue: number | null;
}

export interface DashboardOfferRow {
  id: number;
  number: string;
  recipient: string;
  gross: number;
  validUntil?: string;
  daysRemaining: number | null;
  isExpired: boolean;
}
