import { Injectable, inject, signal, computed } from '@angular/core';
import { WiederkehrendeAusgabenService } from './wiederkehrende-ausgaben.service';
import { ToastService } from '../../core/services/toast.service';
import { WiederkehrendeAusgabe } from '../../core/models';
import { WiederkehrendeAusgabeFormularDaten, LEERES_FORMULAR } from './wiederkehrende-ausgaben.models';
import { KATEGORIEN } from '../../core/utils/format.utils';

@Injectable({ providedIn: 'root' })
export class WiederkehrendeAusgabenFacade {
  private readonly service = inject(WiederkehrendeAusgabenService);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly ausgaben = signal<WiederkehrendeAusgabe[]>([]);
  readonly suchbegriff = signal('');
  readonly bearbeiteteAusgabe = signal<WiederkehrendeAusgabe | null>(null);
  readonly loeschKandidat = signal<number | null>(null);
  readonly formularSichtbar = signal(false);
  readonly formularDaten = signal<WiederkehrendeAusgabeFormularDaten>({ ...LEERES_FORMULAR });
  readonly kategorien = Object.keys(KATEGORIEN);

  readonly gefilterteAusgaben = computed(() => {
    const q = this.suchbegriff().toLowerCase();
    return this.ausgaben().filter(a => !q || a.name.toLowerCase().includes(q) || a.kategorie.toLowerCase().includes(q));
  });

  readonly aktiveSumme = computed(() => {
    const aktive = this.ausgaben().filter(a => a.aktiv);
    const netto = aktive.reduce((s, a) => s + a.brutto / (1 + a.mwst / 100), 0);
    const vst = aktive.reduce((s, a) => s + (a.brutto - a.brutto / (1 + a.mwst / 100)) * (a.abzug / 100), 0);
    return { netto, vst, brutto: aktive.reduce((s, a) => s + a.brutto, 0) };
  });

  ladeDaten(): void {
    this.laedt.set(true);
    this.service.alleLaden().subscribe({
      next: a => { this.ausgaben.set(a); this.laedt.set(false); },
      error: () => { this.toast.error('Daten konnten nicht geladen werden.'); this.laedt.set(false); },
    });
  }

  formularOeffnen(ausgabe?: WiederkehrendeAusgabe): void {
    this.bearbeiteteAusgabe.set(ausgabe ?? null);
    this.formularDaten.set(ausgabe ? {
      name: ausgabe.name, kategorie: ausgabe.kategorie, brutto: ausgabe.brutto,
      mwst: ausgabe.mwst, abzug: ausgabe.abzug, belegnr: ausgabe.belegnr ?? '', aktiv: ausgabe.aktiv,
    } : { ...LEERES_FORMULAR });
    this.formularSichtbar.set(true);
  }

  formularSchliessen(): void { this.formularSichtbar.set(false); this.bearbeiteteAusgabe.set(null); }

  speichern(): void {
    const daten = this.formularDaten();
    if (!daten.name || !daten.brutto) { this.toast.error('Name und Betrag sind Pflichtfelder.'); return; }
    const editId = this.bearbeiteteAusgabe()?.id;
    const anfrage = editId ? this.service.aktualisieren(editId, daten) : this.service.erstellen(daten);
    anfrage.subscribe({
      next: gespeichert => {
        if (editId) this.ausgaben.update(list => list.map(a => a.id === editId ? gespeichert : a));
        else this.ausgaben.update(list => [...list, gespeichert]);
        this.formularSchliessen();
      },
      error: () => this.toast.error('Ausgabe konnte nicht gespeichert werden.'),
    });
  }

  aktivToggle(id: number, aktiv: boolean): void {
    const a = this.ausgaben().find(x => x.id === id);
    if (!a) return;
    this.service.aktualisieren(id, { ...a, aktiv }).subscribe({
      next: aktualisiert => this.ausgaben.update(list => list.map(x => x.id === id ? aktualisiert : x)),
    });
  }

  loeschenBestaetigen(id: number): void { this.loeschKandidat.set(id); }
  loeschenAbbrechen(): void { this.loeschKandidat.set(null); }

  loeschenAusfuehren(): void {
    const id = this.loeschKandidat();
    if (id === null) return;
    this.service.loeschen(id).subscribe({
      next: () => { this.ausgaben.update(list => list.filter(a => a.id !== id)); this.loeschKandidat.set(null); },
      error: () => { this.toast.error('Ausgabe konnte nicht gelöscht werden.'); this.loeschKandidat.set(null); },
    });
  }

  kategorieGeaendert(kategorie: string): void {
    const abzug = KATEGORIEN[kategorie] ?? 100;
    this.formularDaten.update(d => ({ ...d, kategorie, abzug }));
  }

  formularFeldAktualisieren<K extends keyof WiederkehrendeAusgabeFormularDaten>(feld: K, wert: WiederkehrendeAusgabeFormularDaten[K]): void {
    this.formularDaten.update(d => ({ ...d, [feld]: wert }));
  }
}
