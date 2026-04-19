import { Injectable, inject, signal, computed } from '@angular/core';
import { MuellplanService } from './muellplan.service';
import { BrowserService } from '../../core/services/browser.service';
import { ToastService } from '../../core/services/toast.service';
import { Objekt, MuellplanTermin, MuellplanVorlage, Kunde } from '../../core/models';
import { MuellplanFormularDaten, TerminFormularDaten, VorlageFormularDaten, LEERES_OBJEKT_FORMULAR, LEERER_TERMIN, LEERE_VORLAGE } from './muellplan.models';
import { parseVorlageText } from './muellplan.utils';

@Injectable({ providedIn: 'root' })
export class MuellplanFacade {
  private readonly service = inject(MuellplanService);
  private readonly browser = inject(BrowserService);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly objekte = signal<Objekt[]>([]);
  readonly vorlagen = signal<MuellplanVorlage[]>([]);
  readonly kunden = signal<Kunde[]>([]);
  readonly aktuellesObjekt = signal<Objekt | null>(null);
  readonly termine = signal<MuellplanTermin[]>([]);
  readonly anstehendeTermine = signal<MuellplanTermin[]>([]);
  readonly objektFormularSichtbar = signal(false);
  readonly terminFormularSichtbar = signal(false);
  readonly vorlagenModalSichtbar = signal(false);
  readonly vorlageFormularSichtbar = signal(false);
  readonly vorlageAnwendenSichtbar = signal(false);
  readonly bearbeiteterTermin = signal<MuellplanTermin | null>(null);
  readonly bearbeitetesObjekt = signal<Objekt | null>(null);
  readonly loeschKandidat = signal<number | null>(null);
  readonly objektFormularDaten = signal<MuellplanFormularDaten>({ ...LEERES_OBJEKT_FORMULAR });
  readonly terminFormularDaten = signal<TerminFormularDaten>({ ...LEERER_TERMIN });
  readonly vorlageFormularDaten = signal<VorlageFormularDaten>({ ...LEERE_VORLAGE });
  readonly vorlageAnwendenId = signal<number | null>(null);
  readonly vorlageVorschau = signal<{ datum: string; muellart: string; farbe: string }[]>([]);

  // ── Termine kopieren ──────────────────────────────────────────────────────
  readonly kopierenModalSichtbar = signal(false);
  readonly kopierenVonObjektId = signal<number | null>(null);

  readonly terminMonatFilter = signal<number | ''>('');
  readonly vergangeneAusblenden = signal(false);
  readonly muellartFilter = signal('');

  readonly eindeutigeMuellarten = computed(() =>
    [...new Set(this.termine().map(t => t.muellart))].sort()
  );

  readonly gefilterteTermine = computed(() => {
    const monatFilter = this.terminMonatFilter();
    const vergangeneAusblenden = this.vergangeneAusblenden();
    const muellartFilter = this.muellartFilter();
    const heute = new Date(); heute.setHours(0, 0, 0, 0);
    return this.termine()
      .filter(t => {
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
      next: ({ objekte, vorlagen, kunden }) => {
        this.objekte.set(objekte);
        this.vorlagen.set(vorlagen);
        this.kunden.set(kunden);
        this.laedt.set(false);
      },
      error: () => { this.toast.error('Daten konnten nicht geladen werden.'); this.laedt.set(false); },
    });
    this.service.anstehendeTermineLaden().subscribe({
      next: t => this.anstehendeTermine.set(t),
      error: () => {},
    });
  }

  objektAuswaehlen(objekt: Objekt): void {
    this.aktuellesObjekt.set(objekt);
    this.service.termineLaden(objekt.id).subscribe({
      next: t => this.termine.set(t),
      error: () => this.termine.set([]),
    });
  }

  objektFormularOeffnen(objekt?: Objekt): void {
    this.bearbeitetesObjekt.set(objekt ?? null);
    this.objektFormularDaten.set(objekt ? {
      name: objekt.name, strasse: objekt.strasse ?? '', plz: objekt.plz ?? '',
      ort: objekt.ort ?? '', notiz: objekt.notiz ?? '', kunden_id: objekt.kunden_id ?? null,
    } : { ...LEERES_OBJEKT_FORMULAR });
    this.objektFormularSichtbar.set(true);
  }

  objektFormularSchliessen(): void { this.objektFormularSichtbar.set(false); this.bearbeitetesObjekt.set(null); }

  objektSpeichern(): void {
    const daten = this.objektFormularDaten();
    if (!daten.name) { this.toast.error('Bitte Name eingeben.'); return; }
    const editId = this.bearbeitetesObjekt()?.id;
    const payload: Partial<Objekt> = { ...daten, kunden_id: daten.kunden_id ?? undefined };
    const anfrage = editId ? this.service.objektAktualisieren(editId, payload) : this.service.objektErstellen(payload);
    anfrage.subscribe({
      next: gespeichert => {
        if (editId) this.objekte.update(list => list.map(o => o.id === editId ? gespeichert : o));
        else this.objekte.update(list => [...list, gespeichert]);
        this.objektFormularSchliessen();
      },
      error: () => this.toast.error('Objekt konnte nicht gespeichert werden.'),
    });
  }

  objektLoeschenBestaetigen(id: number): void { this.loeschKandidat.set(id); }
  loeschenAbbrechen(): void { this.loeschKandidat.set(null); }

  objektLoeschenAusfuehren(): void {
    const id = this.loeschKandidat();
    if (id === null) return;
    this.service.objektLoeschen(id).subscribe({
      next: () => {
        this.objekte.update(list => list.filter(o => o.id !== id));
        if (this.aktuellesObjekt()?.id === id) { this.aktuellesObjekt.set(null); this.termine.set([]); }
        this.loeschKandidat.set(null);
      },
      error: () => { this.toast.error('Objekt konnte nicht gelöscht werden.'); this.loeschKandidat.set(null); },
    });
  }

  terminFormularOeffnen(termin?: MuellplanTermin): void {
    this.bearbeiteterTermin.set(termin ?? null);
    this.terminFormularDaten.set(termin ? {
      muellart: termin.muellart, farbe: termin.farbe, abholung: termin.abholung,
    } : { ...LEERER_TERMIN, abholung: new Date().toISOString().slice(0, 10) });
    this.terminFormularSichtbar.set(true);
  }

  terminFormularSchliessen(): void { this.terminFormularSichtbar.set(false); this.bearbeiteterTermin.set(null); }

  terminSpeichern(): void {
    const daten = this.terminFormularDaten();
    const objekt = this.aktuellesObjekt();
    if (!objekt || !daten.muellart || !daten.abholung) { this.toast.error('Müllart und Datum sind Pflichtfelder.'); return; }
    const editId = this.bearbeiteterTermin()?.id;
    const payload: Partial<MuellplanTermin> = { ...daten, objekt_id: objekt.id, erledigt: false };
    const anfrage = editId ? this.service.terminAktualisieren(editId, payload) : this.service.terminErstellen(payload);
    anfrage.subscribe({
      next: gespeichert => {
        if (editId) this.termine.update(list => list.map(t => t.id === editId ? gespeichert : t));
        else this.termine.update(list => [...list, gespeichert]);
        this.terminFormularSchliessen();
      },
      error: () => this.toast.error('Termin konnte nicht gespeichert werden.'),
    });
  }

  terminLoeschen(id: number): void {
    this.service.terminLoeschen(id).subscribe({
      next: () => this.termine.update(list => list.filter(t => t.id !== id)),
      error: () => this.toast.error('Termin konnte nicht gelöscht werden.'),
    });
  }

  erledigtToggle(termin: MuellplanTermin): void {
    this.service.terminAktualisieren(termin.id, { ...termin, erledigt: !termin.erledigt }).subscribe({
      next: aktualisiert => this.termine.update(list => list.map(t => t.id === termin.id ? aktualisiert : t)),
    });
  }

  // ── Vorlagen ─────────────────────────────────────────────────────────────
  vorlagenModalOeffnen(): void { this.vorlagenModalSichtbar.set(true); }
  vorlagenModalSchliessen(): void { this.vorlagenModalSichtbar.set(false); }

  vorlageFormularOeffnen(): void {
    this.vorlageFormularDaten.set({ ...LEERE_VORLAGE });
    this.vorlageVorschau.set([]);
    this.vorlageFormularSichtbar.set(true);
  }

  vorlageFormularSchliessen(): void { this.vorlageFormularSichtbar.set(false); }

  vorlageVorschauBerechnen(): void {
    const daten = this.vorlageFormularDaten();
    if (!daten.text) { this.vorlageVorschau.set([]); return; }
    const parsed = parseVorlageText(daten.text, daten.jahr);
    this.vorlageVorschau.set(parsed);
  }

  vorlageSpeichern(): void {
    const daten = this.vorlageFormularDaten();
    if (!daten.name || !daten.text) { this.toast.error('Name und Abfuhrplan-Text sind Pflichtfelder.'); return; }
    const payload: Partial<MuellplanVorlage> = { name: daten.name, inhalt: daten.text };
    this.service.vorlageErstellen(payload).subscribe({
      next: gespeichert => {
        this.vorlagen.update(list => [...list, gespeichert]);
        this.vorlageFormularSchliessen();
      },
      error: () => this.toast.error('Vorlage konnte nicht gespeichert werden.'),
    });
  }

  vorlageLoeschen(id: number): void {
    this.service.vorlageLoeschen(id).subscribe({
      next: () => this.vorlagen.update(list => list.filter(v => v.id !== id)),
      error: () => this.toast.error('Vorlage konnte nicht gelöscht werden.'),
    });
  }

  vorlageAnwendenOeffnen(): void {
    if (!this.aktuellesObjekt()) { this.toast.error('Bitte zuerst ein Objekt auswählen.'); return; }
    this.vorlageAnwendenId.set(this.aktuellesObjekt()?.vorlage_id ?? null);
    this.vorlageAnwendenSichtbar.set(true);
  }

  vorlageAnwendenSchliessen(): void { this.vorlageAnwendenSichtbar.set(false); }

  vorlageAnwenden(): void {
    const vorlageId = this.vorlageAnwendenId();
    const objekt = this.aktuellesObjekt();
    if (!objekt || !vorlageId) { this.toast.error('Bitte eine Vorlage auswählen.'); return; }
    const vorlage = this.vorlagen().find(v => v.id === vorlageId);
    if (!vorlage?.inhalt) { this.toast.error('Vorlage hat keinen Inhalt.'); return; }

    const parsed = parseVorlageText(vorlage.inhalt, new Date().getFullYear());
    const requests = parsed.map(t =>
      this.service.terminErstellen({ objekt_id: objekt.id, muellart: t.muellart, farbe: t.farbe, abholung: t.datum, erledigt: false })
    );

    this.service.objektAktualisieren(objekt.id, { ...objekt, vorlage_id: vorlageId }).subscribe({
      next: aktualisiert => {
        this.aktuellesObjekt.set(aktualisiert);
        this.objekte.update(list => list.map(o => o.id === objekt.id ? aktualisiert : o));
      },
    });

    let created = 0;
    const newTermine: MuellplanTermin[] = [];
    if (!requests.length) { this.vorlageAnwendenSchliessen(); return; }
    requests.forEach(req => {
      req.subscribe({
        next: t => {
          newTermine.push(t);
          created++;
          if (created === requests.length) {
            this.termine.update(list => [...list, ...newTermine].sort((a, b) => a.abholung.localeCompare(b.abholung)));
            this.vorlageAnwendenSchliessen();
          }
        },
        error: () => this.toast.error('Einige Termine konnten nicht erstellt werden.'),
      });
    });
  }

  terminFormularFeldAktualisieren<K extends keyof TerminFormularDaten>(feld: K, wert: TerminFormularDaten[K]): void {
    this.terminFormularDaten.update(d => ({ ...d, [feld]: wert }));
  }

  objektFormularFeldAktualisieren<K extends keyof MuellplanFormularDaten>(feld: K, wert: MuellplanFormularDaten[K]): void {
    this.objektFormularDaten.update(d => ({ ...d, [feld]: wert }));
  }

  vorlageFormularFeldAktualisieren<K extends keyof VorlageFormularDaten>(feld: K, wert: VorlageFormularDaten[K]): void {
    this.vorlageFormularDaten.update(d => ({ ...d, [feld]: wert }));
  }

  // ── Termine kopieren ──────────────────────────────────────────────────────
  kopierenModalOeffnen(): void {
    if (!this.aktuellesObjekt()) { this.toast.error('Bitte zuerst ein Objekt auswählen.'); return; }
    this.kopierenVonObjektId.set(null);
    this.kopierenModalSichtbar.set(true);
  }

  kopierenModalSchliessen(): void { this.kopierenModalSichtbar.set(false); this.kopierenVonObjektId.set(null); }

  termineKopierenAusfuehren(): void {
    const vonId = this.kopierenVonObjektId();
    const zielObjekt = this.aktuellesObjekt();
    if (!vonId || !zielObjekt) { this.toast.error('Bitte ein Quell-Objekt auswählen.'); return; }
    this.service.termineKopieren(vonId, zielObjekt.id).subscribe({
      next: () => {
        this.service.termineLaden(zielObjekt.id).subscribe({
          next: t => this.termine.set(t),
          error: () => {},
        });
        this.kopierenModalSchliessen();
      },
      error: () => this.toast.error('Termine konnten nicht kopiert werden.'),
    });
  }

  monatsabschlussPdfGenerieren(): void {
    const objekt = this.aktuellesObjekt();
    if (!objekt) { this.toast.error('Bitte zuerst ein Objekt auswählen.'); return; }
    this.service.monatsabschlussPdfOeffnen(objekt.id).catch(() => this.toast.error('PDF konnte nicht erstellt werden.'));
  }

  // ── Vorlage PDF ───────────────────────────────────────────────────────────
  vorlagePdfHochladen(vorlageId: number, file: File): void {
    this.service.vorlagePdfHochladen(vorlageId, file).subscribe({
      next: res => {
        this.vorlagen.update(list => list.map(v => v.id === vorlageId ? { ...v, pdf_name: res.pdf_name } : v));
      },
      error: () => this.toast.error('PDF konnte nicht hochgeladen werden.'),
    });
  }

  vorlagePdfOeffnen(vorlageId: number): void {
    this.service.vorlagePdfUrl(vorlageId);
    window.open(this.service.vorlagePdfUrl(vorlageId), '_blank');
  }
}
