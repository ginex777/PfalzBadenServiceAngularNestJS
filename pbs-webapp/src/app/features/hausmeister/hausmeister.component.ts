import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { HausmeisterFacade } from './hausmeister.facade';
import { EinsatzListeComponent } from './components/einsatz-liste/einsatz-liste.component';
import { EinsatzFormularComponent } from './components/einsatz-formular/einsatz-formular.component';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { StatCardComponent } from '../../shared/ui/stat-card/stat-card.component';
import { HausmeisterEinsatz } from '../../core/models';
import { MONATE } from '../../core/utils/format.utils';

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

@Component({
  selector: 'app-hausmeister',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EinsatzListeComponent, EinsatzFormularComponent, ConfirmModalComponent, PageTitleComponent, StatCardComponent],
  templateUrl: './hausmeister.component.html',
  styleUrl: './hausmeister.component.scss',
})
export class HausmeisterComponent implements OnInit {
  protected readonly facade = inject(HausmeisterFacade);
  protected readonly wochenAnsicht = signal(false);
  protected readonly wocheStart = signal<Date>(this.getMontag(new Date()));
  protected readonly wochentage = WOCHENTAGE;

  protected readonly wocheTage = computed(() => {
    const start = this.wocheStart();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  });

  protected readonly einsaetzeProTag = computed(() => {
    const tage = this.wocheTage();
    const einsaetze = this.facade.gefilterteEinsaetze();
    return tage.map(tag => {
      const isoDate = tag.toISOString().slice(0, 10);
      return einsaetze.filter(e => e.datum === isoDate);
    });
  });

  protected readonly wocheLabel = computed(() => {
    const tage = this.wocheTage();
    const start = tage[0];
    const end = tage[6];
    const fmt = (d: Date) => `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.`;
    return `${fmt(start)} – ${fmt(end)}${end.getFullYear()}`;
  });

  ngOnInit(): void { this.facade.ladeDaten(); }

  protected monatLabel(key: string): string {
    const [y, mo] = key.split('-');
    return `${MONATE[parseInt(mo) - 1]} ${y}`;
  }

  protected onEinsatzSpeichern(event: { withPdf: boolean; syncStunden: boolean }): void {
    this.facade.speichern(event.withPdf, event.syncStunden);
  }

  protected mitarbeiterFilterGeaendert(event: Event): void {
    this.facade.mitarbeiterFilterSetzen((event.target as HTMLSelectElement).value);
  }

  protected monatFilterGeaendert(event: Event): void {
    this.facade.monatFilterSetzen((event.target as HTMLSelectElement).value);
  }

  protected suchbegriffGeaendert(event: Event): void {
    this.facade.suchbegriffAktualisieren((event.target as HTMLInputElement).value);
  }

  protected wocheZurueck(): void {
    const d = new Date(this.wocheStart());
    d.setDate(d.getDate() - 7);
    this.wocheStart.set(d);
  }

  protected wocheVor(): void {
    const d = new Date(this.wocheStart());
    d.setDate(d.getDate() + 7);
    this.wocheStart.set(d);
  }

  protected heuteAnzeigen(): void {
    this.wocheStart.set(this.getMontag(new Date()));
  }

  protected istHeute(tag: Date): boolean {
    const heute = new Date().toISOString().slice(0, 10);
    return tag.toISOString().slice(0, 10) === heute;
  }

  protected einsatzBearbeiten(e: HausmeisterEinsatz): void {
    this.facade.formularOeffnen(e);
  }

  private getMontag(d: Date): Date {
    const result = new Date(d);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }
}
