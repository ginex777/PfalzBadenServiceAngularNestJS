import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { WiederkehrendeRechnungenService } from './wiederkehrende-rechnungen.service';
import { ToastService } from '../../core/services/toast.service';
import { WiederkehrendeRechnung, Kunde, RechnungPosition } from '../../core/models';
import { WrFormularDaten, LEERES_WR_FORMULAR } from './wiederkehrende-rechnungen.models';

@Injectable({ providedIn: 'root' })
export class WiederkehrendeRechnungenFacade {
  private readonly service = inject(WiederkehrendeRechnungenService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly rechnungen = signal<WiederkehrendeRechnung[]>([]);
  readonly kunden = signal<Kunde[]>([]);
  readonly formularSichtbar = signal(false);
  readonly bearbeiteteRechnung = signal<WiederkehrendeRechnung | null>(null);
  readonly loeschKandidat = signal<number | null>(null);
  readonly formularDaten = signal<WrFormularDaten>({ ...LEERES_WR_FORMULAR });

  readonly brutto = computed(() =>
    this.formularDaten().positionen.reduce((s, p) => s + (p.gesamtpreis || 0), 0)
  );

  ladeDaten(): void {
    this.laedt.set(true);
    this.service.allesDatenLaden().subscribe({
      next: ({ rechnungen, kunden }) => {
        this.rechnungen.set(rechnungen);
        this.kunden.set(kunden);
        this.laedt.set(false);
      },
      error: () => { this.toast.error('Daten konnten nicht geladen werden.'); this.laedt.set(false); },
    });
  }

  formularOeffnen(wr?: WiederkehrendeRechnung): void {
    this.bearbeiteteRechnung.set(wr ?? null);
    this.formularDaten.set(wr ? {
      kunden_id: wr.kunden_id ?? null,
      titel: wr.titel,
      intervall: wr.intervall,
      aktiv: wr.aktiv,
      positionen: wr.positionen?.length ? wr.positionen : [{ bez: '', stunden: '', einzelpreis: undefined, gesamtpreis: 0 }],
    } : { ...LEERES_WR_FORMULAR });
    this.formularSichtbar.set(true);
  }

  formularSchliessen(): void {
    this.formularSichtbar.set(false);
    this.bearbeiteteRechnung.set(null);
    this.formularDaten.set({ ...LEERES_WR_FORMULAR });
  }

  speichern(): void {
    const daten = this.formularDaten();
    if (!daten.titel) { this.toast.error('Titel ist ein Pflichtfeld.'); return; }
    const kunde = daten.kunden_id ? this.kunden().find(k => k.id === daten.kunden_id) : null;
    const payload: Partial<WiederkehrendeRechnung> = {
      kunden_id: daten.kunden_id ?? undefined,
      kunden_name: kunde?.name,
      titel: daten.titel,
      intervall: daten.intervall,
      aktiv: daten.aktiv,
      positionen: daten.positionen,
    };
    const editId = this.bearbeiteteRechnung()?.id;
    const anfrage = editId ? this.service.aktualisieren(editId, payload) : this.service.erstellen(payload);
    anfrage.subscribe({
      next: gespeichert => {
        if (editId) this.rechnungen.update(list => list.map(r => r.id === editId ? gespeichert : r));
        else this.rechnungen.update(list => [gespeichert, ...list]);
        this.formularSchliessen();
      },
      error: () => this.toast.error('Konnte nicht gespeichert werden.'),
    });
  }

  aktivToggle(id: number, aktiv: boolean): void {
    const wr = this.rechnungen().find(r => r.id === id);
    if (!wr) return;
    this.service.aktualisieren(id, { ...wr, aktiv }).subscribe({
      next: aktualisiert => this.rechnungen.update(list => list.map(r => r.id === id ? aktualisiert : r)),
    });
  }

  loeschenBestaetigen(id: number): void { this.loeschKandidat.set(id); }
  loeschenAbbrechen(): void { this.loeschKandidat.set(null); }

  loeschenAusfuehren(): void {
    const id = this.loeschKandidat();
    if (id === null) return;
    this.service.loeschen(id).subscribe({
      next: () => { this.rechnungen.update(list => list.filter(r => r.id !== id)); this.loeschKandidat.set(null); },
      error: () => { this.toast.error('Konnte nicht gelöscht werden.'); this.loeschKandidat.set(null); },
    });
  }

  jetztErstellen(wr: WiederkehrendeRechnung): void {
    const kunde = wr.kunden_id ? this.kunden().find(k => k.id === wr.kunden_id) : null;
    this.router.navigate(['/rechnungen'], {
      state: {
        convertFrom: 'wiederkehrend',
        data: {
          empf: kunde?.name ?? '',
          str: kunde?.strasse ?? '',
          ort: kunde?.ort ?? '',
          email: kunde?.email ?? '',
          kunden_id: wr.kunden_id,
          titel: wr.titel,
          positionen: wr.positionen,
        },
      },
    });
  }

  positionHinzufuegen(): void {
    this.formularDaten.update(d => ({
      ...d,
      positionen: [...d.positionen, { bez: '', stunden: '', einzelpreis: undefined, gesamtpreis: 0 }],
    }));
  }

  positionEntfernen(index: number): void {
    this.formularDaten.update(d => ({
      ...d,
      positionen: d.positionen.filter((_, i) => i !== index),
    }));
  }

  positionAktualisieren(index: number, position: RechnungPosition): void {
    this.formularDaten.update(d => {
      const positionen = [...d.positionen];
      positionen[index] = position;
      return { ...d, positionen };
    });
  }

  formularFeldAktualisieren<K extends keyof WrFormularDaten>(feld: K, wert: WrFormularDaten[K]): void {
    this.formularDaten.update(d => ({ ...d, [feld]: wert }));
  }
}
