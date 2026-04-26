import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { datumFormatieren, waehrungFormatieren } from '../../core/utils/format.utils';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { StatCardComponent } from '../../shared/ui/stat-card/stat-card.component';
import { DashboardFacade } from './dashboard.facade';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatCardComponent, PageTitleComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  protected readonly facade = inject(DashboardFacade);

  protected readonly formatCurrency = waehrungFormatieren;
  protected readonly formatDate = datumFormatieren;

  ngOnInit(): void {
    this.facade.loadData();
  }

  protected formatDaysOverdue(days: number | null): string {
    if (days === null) return 'Kein Fälligkeitsdatum';
    if (days === 0) return 'Heute fällig';
    if (days === 1) return '1 Tag überfällig';
    return `${days} Tage überfällig`;
  }

  protected formatOfferDue(daysRemaining: number | null): string {
    if (daysRemaining === null) return 'Kein Ablaufdatum';
    if (daysRemaining < 0) return `${Math.abs(daysRemaining)} Tage abgelaufen`;
    if (daysRemaining === 0) return 'Läuft heute ab';
    if (daysRemaining === 1) return 'Läuft morgen ab';
    return `noch ${daysRemaining} Tage`;
  }
}
