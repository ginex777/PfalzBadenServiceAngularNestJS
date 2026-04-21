import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { KanbanFacade } from './kanban.facade';
import { KanbanSpalteComponent } from './components/kanban-spalte/kanban-spalte.component';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { SPALTEN_KONFIGURATION } from './kanban.models';

@Component({
  selector: 'app-kanban',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KanbanSpalteComponent, ConfirmModalComponent],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.scss',
})
export class KanbanComponent implements OnInit {
  protected readonly facade = inject(KanbanFacade);
  protected readonly spalten = SPALTEN_KONFIGURATION;

  ngOnInit(): void {
    this.facade.ladeDaten();
  }

  protected filterSuchbegriffGeaendert(event: Event): void {
    this.facade.filterAktualisieren('suchbegriff', (event.target as HTMLInputElement).value);
  }
  protected filterKategorieGeaendert(event: Event): void {
    this.facade.filterAktualisieren('kategorie', (event.target as HTMLSelectElement).value);
  }
  protected filterBearbeiterGeaendert(event: Event): void {
    this.facade.filterAktualisieren('bearbeiter', (event.target as HTMLSelectElement).value);
  }
  protected filterPrioritaetGeaendert(event: Event): void {
    this.facade.filterAktualisieren('prioritaet', (event.target as HTMLSelectElement).value);
  }
  protected titelGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren('titel', (event.target as HTMLInputElement).value);
  }
  protected beschreibungGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren(
      'beschreibung',
      (event.target as HTMLTextAreaElement).value,
    );
  }
  protected datumGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren('datum', (event.target as HTMLInputElement).value);
  }
  protected bearbeiterGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren('bearbeiter', (event.target as HTMLInputElement).value);
  }
  protected kategorieGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren('kategorie', (event.target as HTMLSelectElement).value);
  }
  protected prioritaetGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren(
      'prioritaet',
      (event.target as HTMLSelectElement).value as 'hoch' | 'mittel' | 'niedrig',
    );
  }
  protected statusGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren(
      'status',
      (event.target as HTMLSelectElement).value as 'todo' | 'inprogress' | 'done' | 'blocked',
    );
  }
}
