import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Task } from '../../../../core/models';
import { KanbanSpalte, PRIORITAET_FARBEN, KATEGORIE_FARBEN } from '../../kanban.models';
import { datumFormatieren } from '../../../../core/utils/format.utils';

@Component({
  selector: 'app-kanban-spalte',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './kanban-spalte.component.html',
  styleUrl: './kanban-spalte.component.scss',
})
export class KanbanSpalteComponent {
  readonly spalteId = input.required<KanbanSpalte>();
  readonly label = input.required<string>();
  readonly tasks = input.required<Task[]>();
  readonly dragTaskId = input<number | null>(null);

  readonly taskBearbeiten = output<Task>();
  readonly taskLoeschen = output<number>();
  readonly dragStart = output<number>();
  readonly dragEnd = output<void>();
  readonly drop = output<KanbanSpalte>();
  readonly schnellHinzufuegen = output<{ titel: string; status: KanbanSpalte }>();

  protected readonly prioritaetFarben = PRIORITAET_FARBEN;
  protected readonly kategorieFarben = KATEGORIE_FARBEN;
  protected readonly datumFormatieren = datumFormatieren;
  protected schnellTitel = '';
  protected dragOver = false;

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  protected onDragLeave(): void { this.dragOver = false; }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    this.drop.emit(this.spalteId());
  }

  protected onDragStart(taskId: number, event: DragEvent): void {
    event.dataTransfer?.setData('text/plain', taskId.toString());
    this.dragStart.emit(taskId);
  }

  protected schnellTitelGeaendert(event: Event): void {
    this.schnellTitel = (event.target as HTMLInputElement).value;
  }

  protected schnellHinzufuegenAusfuehren(): void {    if (!this.schnellTitel.trim()) return;
    this.schnellHinzufuegen.emit({ titel: this.schnellTitel.trim(), status: this.spalteId() });
    this.schnellTitel = '';
  }

  protected onSchnellKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.schnellHinzufuegenAusfuehren();
  }

  protected kategorieStyle(kategorie: string): { background: string; color: string } {
    return this.kategorieFarben[kategorie] ?? { background: '#f1f5f9', color: '#64748b' };
  }
}
