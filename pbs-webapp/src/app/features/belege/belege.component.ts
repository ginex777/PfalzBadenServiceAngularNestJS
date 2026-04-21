import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { FormField, form, maxLength } from '@angular/forms/signals';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BelegeFacade } from './belege.facade';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { StatCardComponent } from '../../shared/ui/stat-card/stat-card.component';
import { SkeletonRowsComponent } from '../../shared/ui/skeleton-rows/skeleton-rows.component';
import { Beleg } from '../../core/models';
import { BelegeFilter, BELEG_TYP_LABELS, NotizFormularDaten } from './belege.models';
import { datumFormatieren } from '../../core/utils/format.utils';

@Component({
  selector: 'app-belege',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormField,
    ConfirmModalComponent,
    PageTitleComponent,
    EmptyStateComponent,
    StatCardComponent,
    SkeletonRowsComponent,
  ],
  templateUrl: './belege.component.html',
  styleUrl: './belege.component.scss',
})
export class BelegeComponent implements OnInit {
  protected readonly facade = inject(BelegeFacade);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly typLabels = BELEG_TYP_LABELS;
  protected readonly datumFormatieren = datumFormatieren;

  protected readonly viewerSafeUrl = computed((): SafeResourceUrl | null => {
    const beleg = this.facade.viewerBeleg();
    if (!beleg) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.facade.downloadUrl(beleg.id, true));
  });

  protected readonly filterOptionen: { id: BelegeFilter; label: string }[] = [
    { id: 'alle', label: 'Alle' },
    { id: 'beleg', label: 'Belege' },
    { id: 'rechnung', label: 'Rechnungen' },
    { id: 'quittung', label: 'Quittungen' },
    { id: 'sonstiges', label: 'Sonstiges' },
  ];

  protected readonly notizModell = signal<NotizFormularDaten>({ notiz: '' });
  protected readonly notizForm = form(this.notizModell, (schema) => {
    maxLength(schema.notiz, 500, { message: 'Max. 500 Zeichen' });
  });

  protected uploadTyp: Beleg['typ'] = 'beleg';

  ngOnInit(): void {
    this.facade.ladeDaten();
  }

  protected jahrFilterGeaendert(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.facade.jahrFilterSetzen(val ? parseInt(val) : null);
  }

  protected filterSelectGeaendert(event: Event): void {
    this.facade.filterSetzen((event.target as HTMLSelectElement).value as BelegeFilter);
  }

  protected suchbegriffGeaendert(event: Event): void {
    this.facade.suchbegriffAktualisieren((event.target as HTMLInputElement).value);
  }

  protected uploadTypAendern(event: Event): void {
    this.uploadTyp = (event.target as HTMLSelectElement).value as Beleg['typ'];
  }

  protected dateiHochladen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const datei = input.files?.[0];
    if (!datei) return;
    this.facade.hochladen(datei, this.uploadTyp, this.notizModell().notiz);
    input.value = '';
    this.notizModell.set({ notiz: '' });
  }

  protected notizBearbeitungStarten(beleg: Beleg): void {
    this.notizModell.set({ notiz: beleg.notiz ?? '' });
    this.facade.notizBearbeitungStarten(beleg.id);
  }

  protected notizSpeichern(id: number): void {
    if (this.notizForm().invalid()) return;
    this.facade.notizSpeichern(id, this.notizModell().notiz);
  }
}
