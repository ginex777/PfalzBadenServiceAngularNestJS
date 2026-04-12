import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ApiService } from '../../core/api/api.service';
import { Kunde, Vertrag, VertragVorlage } from '../../core/models';

const VORLAGEN: { id: VertragVorlage; label: string; beschreibung: string }[] = [
  { id: 'Wartungsvertrag',       label: 'Wartungsvertrag',       beschreibung: 'Regelmäßige Wartung und Instandhaltung' },
  { id: 'Hausmeistervertrag',    label: 'Hausmeistervertrag',    beschreibung: 'Hausmeisterdienste und Objektbetreuung' },
  { id: 'Dienstleistungsvertrag',label: 'Dienstleistungsvertrag',beschreibung: 'Allgemeiner Dienstleistungsvertrag' },
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
  private readonly api = inject(ApiService);

  readonly vorlagen = VORLAGEN;

  vertraege = signal<Vertrag[]>([]);
  kunden = signal<Kunde[]>([]);
  ansicht = signal<Ansicht>('liste');
  laedt = signal(false);
  pdfLaedt = signal(false);
  fehler = signal('');
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
    if (s) v = v.filter(x => x.kunden_name.toLowerCase().includes(s) || x.titel.toLowerCase().includes(s));
    if (this.statusFilter() !== 'alle') v = v.filter(x => x.status === this.statusFilter());
    return v;
  });

  ngOnInit() {
    this._datenLaden();
  }

  private _datenLaden() {
    this.laedt.set(true);
    this.api.kundenLaden().subscribe({ next: k => this.kunden.set(k), error: () => {} });
    this.api.vertraegeLaden().subscribe({
      next: v => { this.vertraege.set(v); this.laedt.set(false); },
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
    this.fehler.set('');
    this.ansicht.set('neu');
  }

  bearbeiten(v: Vertrag) {
    this.bearbeiteteId.set(v.id);
    this.formVertrag.set({ ...v });
    this.fehler.set('');
    this.ansicht.set('bearbeiten');
  }

  kundeGewaehlt(kundenId: string) {
    const kd = this.kunden().find(k => k.id === Number(kundenId));
    if (!kd) return;
    this.formVertrag.update(f => ({
      ...f,
      kunden_id: kd.id,
      kunden_name: kd.name,
      kunden_strasse: kd.strasse ?? null,
      kunden_ort: kd.ort ?? null,
    }));
  }

  titelAktualisieren(vorlage: string) {
    const kunde = this.formVertrag().kunden_name ?? 'Kunde';
    this.formVertrag.update(f => ({ ...f, titel: `${vorlage} – ${kunde}`, vorlage }));
  }

  speichern() {
    const f = this.formVertrag();
    if (!f.kunden_name || !f.vertragsbeginn || !f.vorlage) {
      this.fehler.set('Bitte alle Pflichtfelder ausfüllen.');
      return;
    }
    this.laedt.set(true);
    this.fehler.set('');

    const action$ = this.bearbeiteteId()
      ? this.api.vertragAktualisieren(this.bearbeiteteId()!, f)
      : this.api.vertragErstellen(f);

    action$.subscribe({
      next: (saved) => {
        if (this.bearbeiteteId()) {
          this.vertraege.update(list => list.map(v => v.id === saved.id ? saved : v));
        } else {
          this.vertraege.update(list => [saved, ...list]);
        }
        this.laedt.set(false);
        this.ansicht.set('liste');
        this._toast(this.bearbeiteteId() ? 'Vertrag aktualisiert.' : 'Vertrag erstellt.');
      },
      error: (err) => {
        this.laedt.set(false);
        this.fehler.set(err?.error?.message ?? 'Fehler beim Speichern.');
      },
    });
  }

  loeschen(v: Vertrag) {
    if (!confirm(`Vertrag "${v.titel}" wirklich löschen?`)) return;
    this.api.vertragLoeschen(v.id).subscribe({
      next: () => {
        this.vertraege.update(list => list.filter(x => x.id !== v.id));
        this._toast('Vertrag gelöscht.');
      },
    });
  }

  pdfErstellen(v: Vertrag) {
    this.pdfLaedt.set(true);
    this.api.vertragPdfErstellen(v.id).subscribe({
      next: (res) => {
        this.pdfLaedt.set(false);
        window.open(res.url, '_blank');
      },
      error: () => { this.pdfLaedt.set(false); this._toast('PDF-Erstellung fehlgeschlagen.', true); },
    });
  }

  abbrechen() {
    this.ansicht.set('liste');
    this.fehler.set('');
  }

  statusBadge(status: string): string {
    return status === 'aktiv' ? 'badge-aktiv' : status === 'beendet' ? 'badge-beendet' : 'badge-gekuendigt';
  }

  private _toast(msg: string, istFehler = false) {
    if (istFehler) { this.fehler.set(msg); setTimeout(() => this.fehler.set(''), 4000); }
    else { this.erfolg.set(msg); setTimeout(() => this.erfolg.set(''), 3000); }
  }
}
