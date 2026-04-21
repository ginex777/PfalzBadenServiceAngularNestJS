import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { AuditLogFacade } from './audit-log.facade';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SkeletonRowsComponent } from '../../shared/ui/skeleton-rows/skeleton-rows.component';
import { AuditAktion, AKTION_LABELS, AKTION_KLASSEN, TABELLEN_LABELS } from './audit-log.models';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageTitleComponent, EmptyStateComponent, SkeletonRowsComponent],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
})
export class AuditLogComponent implements OnInit {
  protected readonly facade = inject(AuditLogFacade);
  protected readonly aktionLabels = AKTION_LABELS;
  protected readonly aktionKlassen = AKTION_KLASSEN;
  protected readonly tabellenLabels = TABELLEN_LABELS;

  protected readonly aktionOptionen: { id: AuditAktion; label: string }[] = [
    { id: 'alle', label: 'Alle Aktionen' },
    { id: 'CREATE', label: 'Erstellt' },
    { id: 'UPDATE', label: 'Geändert' },
    { id: 'DELETE', label: 'Gelöscht' },
  ];

  ngOnInit(): void {
    this.facade.ladeDaten();
  }

  protected suchbegriffGeaendert(event: Event): void {
    this.facade.suchbegriffAktualisieren((event.target as HTMLInputElement).value);
  }

  protected aktionFilterGeaendert(event: Event): void {
    this.facade.filterSetzen((event.target as HTMLSelectElement).value as AuditAktion);
  }

  protected tabelleFilterGeaendert(event: Event): void {
    this.facade.tabelleFilterSetzen((event.target as HTMLSelectElement).value);
  }

  protected zeitstempelFormatieren(ts: string): string {
    return new Date(ts).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  protected tabelleLabel(tabelle: string): string {
    return this.tabellenLabels[tabelle] ?? tabelle;
  }

  protected wertKuerzen(wert: unknown): string {
    if (wert == null) return '–';
    const s = typeof wert === 'string' ? wert : JSON.stringify(wert);
    try {
      const obj = JSON.parse(s);
      return JSON.stringify(obj, null, 0).slice(0, 120) + (s.length > 120 ? '…' : '');
    } catch {
      return s.slice(0, 120);
    }
  }
}
