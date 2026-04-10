import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DatevFacade } from './datev.facade';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { DatevZeitraumTyp } from './datev.models';
import { MONATE } from '../../core/utils/format.utils';

@Component({
  selector: 'app-datev',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageTitleComponent],
  templateUrl: './datev.component.html',
  styleUrl: './datev.component.scss',
})
export class DatevComponent implements OnInit {
  protected readonly facade = inject(DatevFacade);
  protected readonly monate = MONATE;
  protected readonly zeitraumTypen: { id: DatevZeitraumTyp; label: string }[] = [
    { id: 'year', label: 'Gesamtjahr' },
    { id: 'q1', label: 'Q1 Jan–Mrz' },
    { id: 'q2', label: 'Q2 Apr–Jun' },
    { id: 'q3', label: 'Q3 Jul–Sep' },
    { id: 'q4', label: 'Q4 Okt–Dez' },
    { id: 'month', label: 'Einzelmonat' },
  ];

  ngOnInit(): void { this.facade.ladeDaten(); }

  protected jahrGeaendert(event: Event): void {
    this.facade.jahrSetzen(+(event.target as HTMLSelectElement).value);
  }

  protected monatGeaendert(event: Event): void {
    this.facade.monatSetzen(+(event.target as HTMLSelectElement).value);
  }

  protected fmt(n: number): string {
    return (parseFloat(String(n)) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
