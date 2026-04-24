import { Injectable, inject, signal, computed } from '@angular/core';
import { MuellplanService } from './muellplan.service';
import { BrowserService } from '../../core/services/browser.service';
import { ToastService } from '../../core/services/toast.service';
import { Objekt, MuellplanTermin, MuellplanVorlage } from '../../core/models';
import {
  TerminFormularDaten,
  VorlageFormularDaten,
  LEERER_TERMIN,
  LEERE_VORLAGE,
} from './muellplan.models';
import { parseVorlageText } from './muellplan.utils';

@Injectable({ providedIn: 'root' })
export class MuellplanFacade {
  private readonly service = inject(MuellplanService);
  private readonly browser = inject(BrowserService);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly objekte = signal<Objekt[]>([]);
  readonly vorlagen = signal<MuellplanVorlage[]>([]);
  readonly aktuellesObjekt = signal<Objekt | null>(null);
  readonly termine = signal<MuellplanTermin[]>([]);
  readonly anstehendeTermine = signal<MuellplanTermin[]>([]);
  readonly terminFormularSichtbar = signal(false);
  readonly vorlagenModalSichtbar = signal(false);
  readonly vorlageFormularSichtbar = signal(false);
  readonly vorlageAnwendenSichtbar = signal(false);
  readonly bearbeiteterTermin = signal<MuellplanTermin | null>(null);
  readonly terminFormularDaten = signal<TerminFormularDaten>({ ...LEERER_TERMIN });
  readonly vorlageFormularDaten = signal<VorlageFormularDaten>({ ...LEERE_VORLAGE });
  readonly vorlageAnwendenId = signal<number | null>(null);
  readonly vorlageVorschau = signal<{ datum: string; muellart: string; farbe: string }[]>([]);

  // â”€â”€ Termine kopieren â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  readonly kopierenModalSichtbar = signal(false);
  readonly kopierenVonObjektId = signal<number | null>(null);

  readonly terminMonatFilter = signal<number | ''>('');
  readonly vergangeneAusblenden = signal(false);
  readonly muellartFilter = signal('');

  readonly eindeutigeMuellarten = computed(() =>
    [...new Set(this.termine().map((t) => t.muellart))].sort(),
  );

  readonly gefilterteTermine = computed(() => {
    const monatFilter = this.terminMonatFilter();
    const vergangeneAusblenden = this.vergangeneAusblenden();
    const muellartFilter = this.muellartFilter();
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    return this.termine()
      .filter((t) => {
        if (vergangeneAusblenden && new Date(t.abholung) < heute) return false;
        if (monatFilter !== '') {
          const monat = new Date(t.abholung).getMonth();
          if (monat !== monatFilter) return false;
        }
        if (muellartFilter !== '' && t.muellart !== muellartFilter) return false;
        return true;
      })
      .sort((a, b) => a.abholung.localeCompare(b.abholung));
  });

  ladeDaten(): void {
    this.laedt.set(true);
    this.service.allesDatenLaden().subscribe({
      next: ({ objekte, vorlagen }) => {
        const activeObjects = objekte.filter((o) => (o.status ?? 'AKTIV') !== 'INAKTIV');
        this.objekte.set(activeObjects);
        this.vorlagen.set(vorlagen);

        const current = this.aktuellesObjekt();
        if (current && (current.status ?? 'AKTIV') === 'INAKTIV') {
          this.aktuellesObjekt.set(null);
          this.termine.set([]);
        }
        this.laedt.set(false);
      },
      error: () => {
        this.toast.error('Daten konnten nicht geladen werden.');
        this.laedt.set(false);
      },
    });
    this.service.anstehendeTermineLaden().subscribe({
      next: (t) => this.anstehendeTermine.set(t),
      error: () => {},
    });
  }

  objektAuswaehlen(objekt: Objekt): void {
    if ((objekt.status ?? 'AKTIV') === 'INAKTIV') return;
    this.aktuellesObjekt.set(objekt);
    this.service.termineLaden(objekt.id).subscribe({
      next: (t) => this.termine.set(t),
      error: () => this.termine.set([]),
    });
  }

  terminFormularOeffnen(termin?: MuellplanTermin): void {
    this.bearbeiteterTermin.set(termin ?? null);
    this.terminFormularDaten.set(
      termin
        ? {
            muellart: termin.muellart,
            farbe: termin.farbe,
            abholung: termin.abholung,
          }
        : { ...LEERER_TERMIN, abholung: new Date().toISOString().slice(0, 10) },
    );
    this.terminFormularSichtbar.set(true);
  }

  terminFormularSchliessen(): void {
    this.terminFormularSichtbar.set(false);
    this.bearbeiteterTermin.set(null);
  }

  terminSpeichern(): void {
    const daten = this.terminFormularDaten();
    const objekt = this.aktuellesObjekt();
    if (!objekt || !daten.muellart || !daten.abholung) {
      this.toast.error('MÃ¼llart und Datum sind Pflichtfelder.');
      return;
    }
    const editId = this.bearbeiteterTermin()?.id;
    const payload: Partial<MuellplanTermin> = { ...daten, objekt_id: objekt.id, erledigt: false };
    const anfrage = editId
      ? this.service.terminAktualisieren(editId, payload)
      : this.service.terminErstellen(payload);
    anfrage.subscribe({
      next: (gespeichert) => {
        if (editId)
          this.termine.update((list) => list.map((t) => (t.id === editId ? gespeichert : t)));
        else this.termine.update((list) => [...list, gespeichert]);
        this.terminFormularSchliessen();
      },
      error: () => this.toast.error('Termin konnte nicht gespeichert werden.'),
    });
  }

  terminLoeschen(id: number): void {
    this.service.terminLoeschen(id).subscribe({
      next: () => this.termine.update((list) => list.filter((t) => t.id !== id)),
      error: () => this.toast.error('Termin konnte nicht gelÃ¶scht werden.'),
    });
  }

  erledigtToggle(termin: MuellplanTermin): void {
    this.service
      .terminAktualisieren(termin.id, { ...termin, erledigt: !termin.erledigt })
      .subscribe({
        next: (aktualisiert) =>
          this.termine.update((list) => list.map((t) => (t.id === termin.id ? aktualisiert : t))),
      });
  }

  setTerminErledigt(id: number, erledigt: boolean): void {
    const termin = this.termine().find((t) => t.id === id);
    if (!termin) return;
    this.service.terminAktualisieren(id, { ...termin, erledigt }).subscribe({
      next: (aktualisiert) =>
        this.termine.update((list) => list.map((t) => (t.id === id ? aktualisiert : t))),
      error: () => this.toast.error('Termin konnte nicht aktualisiert werden.'),
    });
  }

  // â”€â”€ Vorlagen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  vorlagenModalOeffnen(): void {
    this.vorlagenModalSichtbar.set(true);
  }
  vorlagenModalSchliessen(): void {
    this.vorlagenModalSichtbar.set(false);
  }

  vorlageFormularOeffnen(): void {
    this.vorlageFormularDaten.set({ ...LEERE_VORLAGE });
    this.vorlageVorschau.set([]);
    this.vorlageFormularSichtbar.set(true);
  }

  vorlageFormularSchliessen(): void {
    this.vorlageFormularSichtbar.set(false);
  }

  vorlageVorschauBerechnen(): void {
    const daten = this.vorlageFormularDaten();
    if (!daten.text) {
      this.vorlageVorschau.set([]);
      return;
    }
    const parsed = parseVorlageText(daten.text, daten.jahr);
    this.vorlageVorschau.set(parsed);
  }

  vorlageSpeichern(): void {
    const daten = this.vorlageFormularDaten();
    if (!daten.name || !daten.text) {
      this.toast.error('Name und Abfuhrplan-Text sind Pflichtfelder.');
      return;
    }
    const payload: Partial<MuellplanVorlage> = { name: daten.name, inhalt: daten.text };
    this.service.vorlageErstellen(payload).subscribe({
      next: (gespeichert) => {
        this.vorlagen.update((list) => [...list, gespeichert]);
        this.vorlageFormularSchliessen();
      },
      error: () => this.toast.error('Vorlage konnte nicht gespeichert werden.'),
    });
  }

  vorlageLoeschen(id: number): void {
    this.service.vorlageLoeschen(id).subscribe({
      next: () => this.vorlagen.update((list) => list.filter((v) => v.id !== id)),
      error: () => this.toast.error('Vorlage konnte nicht gelÃ¶scht werden.'),
    });
  }

  vorlageAnwendenOeffnen(): void {
    if (!this.aktuellesObjekt()) {
      this.toast.error('Bitte zuerst ein Objekt auswÃ¤hlen.');
      return;
    }
    this.vorlageAnwendenId.set(this.aktuellesObjekt()?.vorlage_id ?? null);
    this.vorlageAnwendenSichtbar.set(true);
  }

  vorlageAnwendenSchliessen(): void {
    this.vorlageAnwendenSichtbar.set(false);
  }

  vorlageAnwenden(): void {
    const vorlageId = this.vorlageAnwendenId();
    const objekt = this.aktuellesObjekt();
    if (!objekt || !vorlageId) {
      this.toast.error('Bitte eine Vorlage auswÃ¤hlen.');
      return;
    }
    const vorlage = this.vorlagen().find((v) => v.id === vorlageId);
    if (!vorlage?.inhalt) {
      this.toast.error('Vorlage hat keinen Inhalt.');
      return;
    }

    const parsed = parseVorlageText(vorlage.inhalt, new Date().getFullYear());
    const requests = parsed.map((t) =>
      this.service.terminErstellen({
        objekt_id: objekt.id,
        muellart: t.muellart,
        farbe: t.farbe,
        abholung: t.datum,
        erledigt: false,
      }),
    );

    this.service.updateObject(objekt.id, { ...objekt, vorlage_id: vorlageId }).subscribe({
      next: (aktualisiert: Objekt) => {
        this.aktuellesObjekt.set(aktualisiert);
        this.objekte.update((list) => list.map((o) => (o.id === objekt.id ? aktualisiert : o)));
      },
    });

    let created = 0;
    const newTermine: MuellplanTermin[] = [];
    if (!requests.length) {
      this.vorlageAnwendenSchliessen();
      return;
    }
    requests.forEach((req) => {
      req.subscribe({
        next: (t) => {
          newTermine.push(t);
          created++;
          if (created === requests.length) {
            this.termine.update((list) =>
              [...list, ...newTermine].sort((a, b) => a.abholung.localeCompare(b.abholung)),
            );
            this.vorlageAnwendenSchliessen();
          }
        },
        error: () => this.toast.error('Einige Termine konnten nicht erstellt werden.'),
      });
    });
  }

  terminFormularFeldAktualisieren<K extends keyof TerminFormularDaten>(
    feld: K,
    wert: TerminFormularDaten[K],
  ): void {
    this.terminFormularDaten.update((d) => ({ ...d, [feld]: wert }));
  }

  vorlageFormularFeldAktualisieren<K extends keyof VorlageFormularDaten>(
    feld: K,
    wert: VorlageFormularDaten[K],
  ): void {
    this.vorlageFormularDaten.update((d) => ({ ...d, [feld]: wert }));
  }

  // â”€â”€ Termine kopieren â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  kopierenModalOeffnen(): void {
    if (!this.aktuellesObjekt()) {
      this.toast.error('Bitte zuerst ein Objekt auswÃ¤hlen.');
      return;
    }
    this.kopierenVonObjektId.set(null);
    this.kopierenModalSichtbar.set(true);
  }

  kopierenModalSchliessen(): void {
    this.kopierenModalSichtbar.set(false);
    this.kopierenVonObjektId.set(null);
  }

  termineKopierenAusfuehren(): void {
    const vonId = this.kopierenVonObjektId();
    const zielObjekt = this.aktuellesObjekt();
    if (!vonId || !zielObjekt) {
      this.toast.error('Bitte ein Quell-Objekt auswÃ¤hlen.');
      return;
    }
    this.service.termineKopieren(vonId, zielObjekt.id).subscribe({
      next: () => {
        this.service.termineLaden(zielObjekt.id).subscribe({
          next: (t) => this.termine.set(t),
          error: () => {},
        });
        this.kopierenModalSchliessen();
      },
      error: () => this.toast.error('Termine konnten nicht kopiert werden.'),
    });
  }

  monatsabschlussPdfGenerieren(): void {
    const objekt = this.aktuellesObjekt();
    if (!objekt) {
      this.toast.error('Bitte zuerst ein Objekt auswÃ¤hlen.');
      return;
    }
    this.service
      .monatsabschlussPdfOeffnen(objekt.id)
      .catch(() => this.toast.error('PDF konnte nicht erstellt werden.'));
  }

  // â”€â”€ Vorlage PDF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  vorlagePdfHochladen(vorlageId: number, file: File): void {
    this.service.vorlagePdfHochladen(vorlageId, file).subscribe({
      next: (res) => {
        this.vorlagen.update((list) =>
          list.map((v) => (v.id === vorlageId ? { ...v, pdf_name: res.pdf_name } : v)),
        );
      },
      error: () => this.toast.error('PDF konnte nicht hochgeladen werden.'),
    });
  }

  vorlagePdfOeffnen(vorlageId: number): void {
    this.service.vorlagePdfUrl(vorlageId);
    window.open(this.service.vorlagePdfUrl(vorlageId), '_blank');
  }
}
