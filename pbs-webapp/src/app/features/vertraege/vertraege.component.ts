import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { VertraegeService } from './vertraege.service';
import { ToastService } from '../../core/services/toast.service';
import { Kunde, Vertrag, VertragVorlage } from '../../core/models';
import { BrowserService } from '../../core/services/browser.service';

const VORLAGEN: { id: VertragVorlage; label: string; beschreibung: string }[] = [
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
  imports: [FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './vertraege.component.html',
  styleUrl: './vertraege.component.scss',
})
export class VertraegeComponent implements OnInit {
  private readonly service = inject(VertraegeService);
  private readonly browser = inject(BrowserService);
  private readonly toast = inject(ToastService);

  readonly vorlagen = VORLAGEN;

  vertraege = signal<Vertrag[]>([]);
  kunden = signal<Kunde[]>([]);
  ansicht = signal<Ansicht>('liste');
  laedt = signal(false);
  pdfLaedt = signal(false);
  erfolg = signal('');

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

    const action$ = this.bearbeiteteId()
      ? this.service.updateContract(this.bearbeiteteId()!, f)
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
        this._toast(this.bearbeiteteId() ? 'Vertrag aktualisiert.' : 'Vertrag erstellt.');
      },
      error: (err) => {
        this.laedt.set(false);
        this.toast.error(err?.error?.message ?? 'Fehler beim Speichern.');
      },
    });
  }

  loeschen(v: Vertrag) {
    if (!confirm(`Vertrag "${v.titel}" wirklich löschen?`)) return;
    this.service.deleteContract(v.id).subscribe({
      next: () => {
        this.vertraege.update((list) => list.filter((x) => x.id !== v.id));
        this._toast('Vertrag gelöscht.');
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

  statusBadge(status: string): string {
    return status === 'aktiv'
      ? 'badge-aktiv'
      : status === 'beendet'
        ? 'badge-beendet'
        : 'badge-gekuendigt';
  }

  private _toast(msg: string) {
    this.erfolg.set(msg);
    setTimeout(() => this.erfolg.set(''), 3000);
  }
}
