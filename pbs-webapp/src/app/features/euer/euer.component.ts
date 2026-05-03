import type { OnInit} from '@angular/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EuerFacade } from './euer.facade';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { waehrungFormatieren } from '../../core/utils/format.utils';

@Component({
  selector: 'app-euer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageTitleComponent],
  templateUrl: './euer.component.html',
  styleUrl: './euer.component.scss',
})
export class EuerComponent implements OnInit {
  protected readonly facade = inject(EuerFacade);

  ngOnInit(): void {
    this.facade.ladeDaten();
  }

  protected jahrGeaendert(event: Event): void {
    this.facade.jahrWechseln(parseInt((event.target as HTMLSelectElement).value));
  }

  protected fmt(n: number): string {
    return waehrungFormatieren(n);
  }
  protected fmtAbs(n: number): string {
    return waehrungFormatieren(Math.abs(n));
  }
}
