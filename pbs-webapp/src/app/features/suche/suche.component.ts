import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormField, form, minLength } from '@angular/forms/signals';
import { SucheFacade } from './suche.facade';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SucheFormularDaten } from './suche.models';
import { datumFormatieren, waehrungFormatieren } from '../../core/utils/format.utils';

@Component({
  selector: 'app-suche',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, PageTitleComponent, EmptyStateComponent],
  templateUrl: './suche.component.html',
  styleUrl: './suche.component.scss',
})
export class SucheComponent implements OnInit {
  protected readonly facade = inject(SucheFacade);
  private readonly route = inject(ActivatedRoute);

  protected readonly sucheModell = signal<SucheFormularDaten>({ suchbegriff: '' });

  protected readonly sucheForm = form(this.sucheModell, (schema) => {
    minLength(schema.suchbegriff, 2, { message: 'Mindestens 2 Zeichen eingeben' });
  });

  protected readonly datumFormatieren = datumFormatieren;
  protected readonly waehrungFormatieren = waehrungFormatieren;

  ngOnInit(): void {
    this.facade.ladeDaten();
    this.route.queryParams.subscribe((params) => {
      if (params['q']) {
        this.sucheModell.set({ suchbegriff: params['q'] });
        this.facade.suchbegriffSetzen(params['q']);
      }
    });
  }

  protected onSuche(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.sucheModell.set({ suchbegriff: q });
    this.facade.suchbegriffSetzen(q);
  }

  protected leeren(): void {
    this.sucheModell.set({ suchbegriff: '' });
    this.facade.suchbegriffSetzen('');
  }
}
