import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { VertraegeService } from './vertraege.service';
import { ToastService } from '../../core/services/toast.service';
import type { Kunde, Vertrag, VertragVorlage } from '../../core/models';
import { BrowserService } from '../../core/services/browser.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { StatusBadgeComponent, type StatusBadgeTyp } from '../../shared/ui/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { DrawerComponent } from '../../shared/ui/drawer/drawer.component';
import { getApiErrorMessage } from '../../core/api-error';

const VORLAGEN: Array<{ id: VertragVorlage; label: string; beschreibung: string }> = [
  {
    id: 'Wartungsvertrag',
    label: 'Wartungsvertrag',
    beschreibung: 'Regelmäßige Wartung und Instandhaltung',
  },
  {
    id: 'Hausmeistervertrag',
    label: 'Hausmeistervertrag',
    beschreibung: 'Hausmeisterdienste und Objektbetreuung',
  },
  {
    id: 'Dienstleistungsvertrag',
    label: 'Dienstleistungsvertrag',
    beschreibung: 'Allgemeiner Dienstleistungsvertrag',
  },
];

type Ansicht = 'liste' | 'neu' | 'bearbeiten';

@Component({
  selector: 'app-vertraege',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, CurrencyPipe, PageTitleComponent, StatusBadgeComponent, EmptyStateComponent, DrawerComponent],
  templateUrl: './vertraege.component.html',
  styleUrl: './vertraege.component.scss',
})
export class VertraegeComponent implements OnInit {
  private readonly service = inject(VertraegeService);
  private readonly browser = inject(BrowserService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly vorlagen = VORLAGEN;

  vertraege = signal<Vertrag[]>([]);
  kunden = signal<Kunde[]>([]);
  ansicht = signal<Ansicht>('liste');
  laedt = signal(false);
  pdfLaedt = signal(false);

  // Form state
  formVertrag = signal<Partial<Vertrag>>({
    vorlage: 'Dienstleistungsvertrag',
    laufzeit_monate: 12,
    monatliche_rate: 0,
    kuendigungsfrist: 3,
    vertragsbeginn: new Date().toISOString().slice(0, 10),
    status: 'aktiv',
  });
  bearbeiteteId = signal<number | null>(null);

  // Filter
  suchbegriff = signal('');
  statusFilter = signal<string>('alle');

  readonly formularSichtbar = computed(() => this.ansicht() !== 'liste');

  readonly gefilterteVertraege = computed(() => {
    let v = this.vertraege();
    const s = this.suchbegriff().toLowerCase();
    if (s)
      v = v.filter(
        (x) => x.kunden_name.toLowerCase().includes(s) || x.titel.toLowerCase().includes(s),
      );
    if (this.statusFilter() !== 'alle') v = v.filter((x) => x.status === this.statusFilter());
    return v;
  });

  ngOnInit() {
    this._datenLaden();
  }

  private _datenLaden() {
    this.laedt.set(true);
    this.service.loadCustomers().subscribe({ next: (k) => this.kunden.set(k), error: () => {} });
    this.service.loadContracts().subscribe({
      next: (v) => {
        this.vertraege.set(v);
        this.laedt.set(false);
      },
      error: () => this.laedt.set(false),
    });
  }

  neuStarten() {
    this.bearbeiteteId.set(null);
    this.formVertrag.set({
      vorlage: 'Dienstleistungsvertrag',
      laufzeit_monate: 12,
      monatliche_rate: 0,
      kuendigungsfrist: 3,
      vertragsbeginn: new Date().toISOString().slice(0, 10),
      status: 'aktiv',
    });
    this.ansicht.set('neu');
  }

  bearbeiten(v: Vertrag) {
    this.bearbeiteteId.set(v.id);
    this.formVertrag.set({ ...v });
    this.ansicht.set('bearbeiten');
  }

  kundeGewaehlt(kundenId: string) {
    const kd = this.kunden().find((k) => k.id === Number(kundenId));
    if (!kd) return;
    this.formVertrag.update((f) => ({
      ...f,
      kunden_id: kd.id,
      kunden_name: kd.name,
      kunden_strasse: kd.strasse ?? null,
      kunden_ort: kd.ort ?? null,
    }));
  }

  titelAktualisieren(vorlage: string) {
    const kunde = this.formVertrag().kunden_name ?? 'Kunde';
    this.formVertrag.update((f) => ({ ...f, titel: `${vorlage} – ${kunde}`, vorlage }));
  }

  speichern() {
    const f = this.formVertrag();
    if (!f.kunden_name || !f.vertragsbeginn || !f.vorlage) {
      this.toast.error('Bitte alle Pflichtfelder ausfüllen.');
      return;
    }
    this.laedt.set(true);

    const contractId = this.bearbeiteteId();
    const action$ = contractId
      ? this.service.updateContract(contractId, f)
      : this.service.createContract(f);

    action$.subscribe({
      next: (saved) => {
        if (this.bearbeiteteId()) {
          this.vertraege.update((list) => list.map((v) => (v.id === saved.id ? saved : v)));
        } else {
          this.vertraege.update((list) => [saved, ...list]);
        }
        this.laedt.set(false);
        this.ansicht.set('liste');
        this.toast.success(this.bearbeiteteId() ? 'Vertrag aktualisiert.' : 'Vertrag erstellt.');
      },
      error: (err) => {
        this.laedt.set(false);
        this.toast.error(getApiErrorMessage(err) ?? 'Fehler beim Speichern.');
      },
    });
  }

  async loeschen(v: Vertrag) {
    const ok = await this.confirm.confirm({ message: `Vertrag "${v.titel}" wirklich löschen?` });
    if (!ok) return;
    this.service.deleteContract(v.id).subscribe({
      next: () => {
        this.vertraege.update((list) => list.filter((x) => x.id !== v.id));
        this.toast.success('Vertrag gelöscht.');
      },
    });
  }

  pdfErstellen(v: Vertrag) {
    this.pdfLaedt.set(true);
    this.service.createContractPdf(v.id).subscribe({
      next: (res) => {
        this.pdfLaedt.set(false);
        this.browser.blobOeffnen(res.url);
      },
      error: () => {
        this.pdfLaedt.set(false);
        this.toast.error('PDF-Erstellung fehlgeschlagen.');
      },
    });
  }

  abbrechen() {
    this.ansicht.set('liste');
  }

  statusBadge(status: string): StatusBadgeTyp {
    if (status === 'aktiv') return 'aktiv';
    if (status === 'beendet') return 'beendet';
    if (status === 'gekuendigt') return 'gekuendigt';
    return 'aktiv';
  }

}
