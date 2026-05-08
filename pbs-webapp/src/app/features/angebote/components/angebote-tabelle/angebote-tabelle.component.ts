import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import type { Angebot } from '../../../../core/models';
import type { AngebotFilter } from '../../angebote.models';
import type {
  StatusBadgeTyp} from '../../../../shared/ui/status-badge/status-badge.component';
import {
  StatusBadgeComponent
} from '../../../../shared/ui/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { ConfirmModalComponent } from '../../../../shared/ui/confirm-modal/confirm-modal.component';
import { waehrungFormatieren, datumFormatieren } from '../../../../core/utils/format.utils';
import { RoleAllowedDirective } from '../../../../core/directives/role-allowed.directive';
import { OverflowMenuComponent } from '../../../../shared/ui/overflow-menu/overflow-menu.component';

@Component({
  selector: 'app-angebote-tabelle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeComponent, EmptyStateComponent, ConfirmModalComponent, RoleAllowedDirective, OverflowMenuComponent],
  templateUrl: './angebote-tabelle.component.html',
  styleUrl: './angebote-tabelle.component.scss',
})
export class AngeboteTabelleComponent {
  readonly quotes = input.required<Angebot[]>();
  readonly loading = input<boolean>(false);
  readonly activeFilter = input<AngebotFilter>('alle');

  readonly editRequested = output<Angebot>();
  readonly deleteRequested = output<number>();
  readonly setStatus = output<{ id: number; status: 'angenommen' | 'abgelehnt' | 'gesendet' }>();
  readonly generatePdf = output<Angebot>();
  readonly convertToInvoice = output<Angebot>();
  readonly filterChange = output<AngebotFilter>();
  readonly copyRequested = output<Angebot>();

  protected readonly waehrungFormatieren = waehrungFormatieren;
  protected readonly datumFormatieren = datumFormatieren;
  protected readonly MONATE = [
    'Jan',
    'Feb',
    'Mär',
    'Apr',
    'Mai',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Okt',
    'Nov',
    'Dez',
  ];
  protected monatFilter = '';
  protected readonly pendingDeleteId = signal<number | null>(null);

  protected gefiltertequotes(): Angebot[] {
    if (this.monatFilter === '') return this.quotes();
    const m = parseInt(this.monatFilter);
    return this.quotes().filter((a) => a.datum && new Date(a.datum).getMonth() === m);
  }

  protected onFilterSelectChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as AngebotFilter;
    this.filterChange.emit(val);
  }

  protected monatGeaendert(event: Event): void {
    this.monatFilter = (event.target as HTMLSelectElement).value;
  }

  protected filterLeeren(): void {
    this.monatFilter = '';
    this.filterChange.emit('alle');
  }

  protected onStatusChange(angebot: Angebot, event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    if (!status) return;
    (event.target as HTMLSelectElement).value = '';
    if (status === 'offen') {
      this.setStatus.emit({ id: angebot.id, status: 'gesendet' }); // reset via gesendet=false
      return;
    }
    this.setStatus.emit({
      id: angebot.id,
      status: status as 'angenommen' | 'abgelehnt' | 'gesendet',
    });
  }

  protected loeschenBestaetigen(id: number): void {
    this.pendingDeleteId.set(id);
  }

  protected loeschenBestaetigt(): void {
    const id = this.pendingDeleteId();
    if (id !== null) this.deleteRequested.emit(id);
    this.pendingDeleteId.set(null);
  }

  protected istAbgelaufen(angebot: Angebot): boolean {
    if (!angebot.gueltig_bis || angebot.angenommen || angebot.abgelehnt) return false;
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    return new Date(angebot.gueltig_bis) < heute;
  }

  protected statusTyp(angebot: Angebot): StatusBadgeTyp {
    if (angebot.angenommen) return 'angenommen';
    if (angebot.abgelehnt) return 'abgelehnt';
    if (angebot.gesendet) return 'gesendet';
    return 'offen';
  }
}
