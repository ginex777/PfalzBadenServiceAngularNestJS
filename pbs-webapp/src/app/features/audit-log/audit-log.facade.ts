import { Injectable, inject, signal, computed } from '@angular/core';
import { AuditLogService } from './audit-log.service';
import { ToastService } from '../../core/services/toast.service';
import { AuditLogEntry } from '../../core/models';
import { AuditAktion } from './audit-log.models';

@Injectable({ providedIn: 'root' })
export class AuditLogFacade {
  private readonly service = inject(AuditLogService);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly eintraege = signal<AuditLogEntry[]>([]);
  readonly suchbegriff = signal('');
  readonly aktiverAktionFilter = signal<AuditAktion>('alle');
  readonly aktiveTabelleFilter = signal('');
  readonly aktuelleSeite = signal(1);

  private readonly PAGE_SIZE = 25;

  readonly gefilterteEintraege = computed(() => {
    const q = this.suchbegriff().toLowerCase();
    const aktion = this.aktiverAktionFilter();
    const tabelle = this.aktiveTabelleFilter();
    return this.eintraege()
      .filter((e) => aktion === 'alle' || e.aktion === aktion)
      .filter((e) => !tabelle || e.tabelle === tabelle)
      .filter(
        (e) =>
          !q || [e.tabelle, e.aktion, e.neu_wert, e.alt_wert].join(' ').toLowerCase().includes(q),
      )
      .sort((a, b) => b.zeitstempel.localeCompare(a.zeitstempel));
  });

  readonly gesamtSeiten = computed(() =>
    Math.max(1, Math.ceil(this.gefilterteEintraege().length / this.PAGE_SIZE)),
  );

  readonly seitenEintraege = computed(() => {
    const seite = Math.min(this.aktuelleSeite(), this.gesamtSeiten());
    const start = (seite - 1) * this.PAGE_SIZE;
    return this.gefilterteEintraege().slice(start, start + this.PAGE_SIZE);
  });

  readonly eindeutigeTabellen = computed(() =>
    [...new Set(this.eintraege().map((e) => e.tabelle))].sort(),
  );

  ladeDaten(): void {
    this.laedt.set(true);
    this.service.alleLaden().subscribe({
      next: (e) => {
        this.eintraege.set(e);
        this.aktuelleSeite.set(1);
        this.laedt.set(false);
      },
      error: () => {
        this.toast.error('Audit-Log konnte nicht geladen werden.');
        this.laedt.set(false);
      },
    });
  }

  filterSetzen(aktion: AuditAktion): void {
    this.aktiverAktionFilter.set(aktion);
    this.aktuelleSeite.set(1);
  }
  tabelleFilterSetzen(tabelle: string): void {
    this.aktiveTabelleFilter.set(tabelle);
    this.aktuelleSeite.set(1);
  }
  suchbegriffAktualisieren(q: string): void {
    this.suchbegriff.set(q);
    this.aktuelleSeite.set(1);
  }
  seiteVor(): void {
    this.aktuelleSeite.update((s) => Math.min(s + 1, this.gesamtSeiten()));
  }
  seiteZurueck(): void {
    this.aktuelleSeite.update((s) => Math.max(s - 1, 1));
  }
}
