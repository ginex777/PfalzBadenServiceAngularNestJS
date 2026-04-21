import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardFacade } from './dashboard.facade';
import { StatCardComponent } from '../../shared/ui/stat-card/stat-card.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { waehrungFormatieren, datumFormatieren } from '../../core/utils/format.utils';
import { MS_PER_DAY } from '../../core/constants';

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
  protected readonly aktuellesJahr = new Date().getFullYear();

  protected readonly waehrungFormatieren = waehrungFormatieren;
  protected readonly datumFormatieren = datumFormatieren;

  ngOnInit(): void {
    this.facade.ladeDaten();
  }

  protected tageText(tage: number | null, ueberfaellig: boolean): string {
    if (tage === null) return 'Kein Fälligkeitsdatum';
    if (ueberfaellig) return `${tage} Tage überfällig`;
    if (tage === 0) return 'Heute fällig';
    if (tage === 1) return 'Morgen fällig';
    return `noch ${tage} Tage`;
  }

  protected muellTerminBadge(abholung: string): string {
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    const diff = Math.round((new Date(abholung).getTime() - heute.getTime()) / MS_PER_DAY);
    if (diff === 0) return 'Heute!';
    if (diff === 1) return 'Morgen';
    return `in ${diff}T`;
  }

  protected muellTerminBadgeKlasse(abholung: string): string {
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    const diff = Math.round((new Date(abholung).getTime() - heute.getTime()) / MS_PER_DAY);
    if (diff === 0) return 'badge-danger';
    if (diff === 1) return 'badge-warning';
    return 'badge-neutral';
  }

  protected aktivitaetDatumFormatieren(datum: string | undefined): string {
    if (!datum) return '–';
    const d = new Date(datum);
    return (
      d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    );
  }

  protected einsatzDatumBadge(datum: string): string {
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    const diff = Math.round((new Date(datum).getTime() - heute.getTime()) / MS_PER_DAY);
    if (diff === 0) return 'Heute';
    if (diff === 1) return 'Morgen';
    return `in ${diff} Tagen`;
  }
}
