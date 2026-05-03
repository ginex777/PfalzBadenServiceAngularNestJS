// ============================================================
// Buchhaltung — Facade (State + Business-Logik + API-Koordination)
// ============================================================

import { Injectable, inject, signal, computed } from '@angular/core';
import { BuchhaltungService } from './buchhaltung.service';
import { ToastService } from '../../core/services/toast.service';
import type {
  AccountingMonthSummary,
  AccountingYearSummary,
  BuchhaltungEintrag,
  BuchhaltungJahr,
  VstPaid,
} from '../../core/models';
import type {
  BuchhaltungZeile,
  MonatsDaten,
  QuartalsDaten,
  VstQuartal,
  AnsichtsModus,
  SpeicherStatus,
} from './buchhaltung.models';
import { MONATE, KATEGORIEN } from '../../core/utils/format.utils';
import { forkJoin } from 'rxjs';

function neuesTempId(): string {
  return Math.random().toString(36).slice(2);
}

function eintragZuZeile(e: BuchhaltungEintrag): BuchhaltungZeile {
  return { ...e, _tempId: neuesTempId() };
}

function leereJahresZusammenfassung(): AccountingYearSummary {
  return {
    months: Array.from({ length: 12 }, (_, month) => ({
      month,
      incomeNet: 0,
      incomeVat: 0,
      expenseNet: 0,
      inputVat: 0,
      vatLiability: 0,
      profit: 0,
    })),
    quarters: [],
  };
}

@Injectable({ providedIn: 'root' })
export class BuchhaltungFacade {
  private readonly service = inject(BuchhaltungService);
  private readonly toast = inject(ToastService);

  // ── State ────────────────────────────────────────────────────────────────
  readonly ladelaeuft = signal(false);
  readonly aktuellesJahr = signal(new Date().getFullYear());
  readonly aktuellerMonat = signal(new Date().getMonth()); // 0-11
  readonly ansichtsModus = signal<AnsichtsModus>('monat');
  readonly speicherStatus = signal<SpeicherStatus>({ dirty: false, speichernLaeuft: false });

  /** Rohdaten vom Server: monat (0-11) → { inc, exp } */
  private readonly _jahresDaten = signal<BuchhaltungJahr>({});
  private readonly _jahresZusammenfassung =
    signal<AccountingYearSummary>(leereJahresZusammenfassung());
  /** In-Memory Zeilen pro Monat */
  private readonly _einnahmenZeilen = signal<Record<number, BuchhaltungZeile[]>>({});
  private readonly _ausgabenZeilen = signal<Record<number, BuchhaltungZeile[]>>({});

  readonly gesperrteMonateSet = signal<Set<number>>(new Set());
  private readonly _vstPaid = signal<Record<string, boolean | string>>({});

  readonly bestaetigenDialog = signal<{
    titel: string;
    nachricht: string;
    aktion: () => void;
  } | null>(null);

  // ── Computed ─────────────────────────────────────────────────────────────
  readonly aktuelleEinnahmen = computed(() => this._einnahmenZeilen()[this.aktuellerMonat()] ?? []);
  readonly aktuelleAusgaben = computed(() => this._ausgabenZeilen()[this.aktuellerMonat()] ?? []);

  readonly istGesperrt = computed(
    () => this.aktuellerMonat() >= 0 && this.gesperrteMonateSet().has(this.aktuellerMonat()),
  );

  readonly monatHatDaten = computed(() => {
    const inc = this._einnahmenZeilen();
    const exp = this._ausgabenZeilen();
    return (monat: number) => (inc[monat]?.length ?? 0) > 0 || (exp[monat]?.length ?? 0) > 0;
  });

  readonly aktuellesMonatsergebnis = computed<MonatsDaten>(() =>
    this._monatsDatenAusServerSummary(this._jahresZusammenfassung().months[this.aktuellerMonat()]),
  );

  readonly quartalsDaten = computed<QuartalsDaten[]>(() => {
    const quartale = [
      { label: 'Q1 (Jan–Mrz)', monate: [0, 1, 2] },
      { label: 'Q2 (Apr–Jun)', monate: [3, 4, 5] },
      { label: 'Q3 (Jul–Sep)', monate: [6, 7, 8] },
      { label: 'Q4 (Okt–Dez)', monate: [9, 10, 11] },
    ];
    return quartale.map((q) => {
      let einnahmenNetto = 0,
        einnahmenUst = 0,
        ausgabenNetto = 0,
        vorsteuer = 0;
      q.monate.forEach((m) => {
        const d = this._monatsDatenBerechnen(m);
        einnahmenNetto += d.einnahmenNetto;
        einnahmenUst += d.einnahmenUst;
        ausgabenNetto += d.ausgabenNetto;
        vorsteuer += d.vorsteuer;
      });
      const zahllast = einnahmenUst - vorsteuer;
      const gewinn = einnahmenNetto - ausgabenNetto;
      return { ...q, einnahmenNetto, einnahmenUst, ausgabenNetto, vorsteuer, zahllast, gewinn };
    });
  });

  readonly jahresMonatsDaten = computed(() =>
    Array.from({ length: 12 }, (_, i) => ({
      monat: i,
      name: MONATE[i],
      ...this._monatsDatenBerechnen(i),
    })),
  );

  readonly vstQuartale = computed<VstQuartal[]>(() => {
    const quartale = [
      { label: 'Q1 (Jan–Mrz)', monate: [0, 1, 2] },
      { label: 'Q2 (Apr–Jun)', monate: [3, 4, 5] },
      { label: 'Q3 (Jul–Sep)', monate: [6, 7, 8] },
      { label: 'Q4 (Okt–Dez)', monate: [9, 10, 11] },
    ];
    return quartale.map((q, qi) => {
      const schluessel = `q${qi}`;
      const elster = this._elsterDatenBerechnen(q.monate);
      const zahllast = elster.kz83 + elster.kz85 - elster.kz66;
      const bezahlt = !!this._vstPaid()[schluessel];
      const datum = (this._vstPaid()[`${schluessel  }_date`] as string) ?? '';
      const offen = bezahlt ? 0 : zahllast;
      return {
        schluessel,
        label: q.label,
        monate: q.monate,
        elster,
        zahllast,
        bezahlt,
        datum,
        offen,
      };
    });
  });

  // ── Lade-Aktionen ────────────────────────────────────────────────────────
  ladeDaten(): void {
    this.ladelaeuft.set(true);
    const jahr = this.aktuellesJahr();

    forkJoin({
      jahresDaten: this.service.jahresDateLaden(jahr),
      zusammenfassung: this.service.jahresZusammenfassungLaden(jahr),
      vstDaten: this.service.loadVst(jahr),
      gesperrte: this.service.loadLockedMonths(jahr),
    }).subscribe({
      next: ({ jahresDaten, zusammenfassung, vstDaten, gesperrte }) => {
        this._jahresDatenVerarbeiten(jahresDaten);
        this._jahresZusammenfassung.set(zusammenfassung);
        this._vstDatenVerarbeiten(vstDaten);
        this.gesperrteMonateSet.set(new Set(gesperrte.map((g) => g.monat)));
        this.ladelaeuft.set(false);
      },
      error: (err: Error) => {
        this.toast.error(`Daten konnten nicht geladen werden: ${  err.message}`);
        this.ladelaeuft.set(false);
      },
    });
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  monatWechseln(monat: number): void {
    if (this.speicherStatus().dirty) {
      this.batchSpeichern().then(() => {
        this.aktuellerMonat.set(monat);
        this.ansichtsModus.set('monat');
      });
    } else {
      this.aktuellerMonat.set(monat);
      this.ansichtsModus.set('monat');
    }
  }

  jahresansichtUmschalten(): void {
    if (this.speicherStatus().dirty) {
      this.batchSpeichern().then(() => this.ansichtsModus.set('jahresuebersicht'));
    } else {
      this.ansichtsModus.set('jahresuebersicht');
    }
  }

  jahrWechseln(jahr: number): void {
    const wechseln = () => {
      this.aktuellesJahr.set(jahr);
      this.ladeDaten();
    };
    if (this.speicherStatus().dirty) {
      this.batchSpeichern().then(wechseln);
    } else {
      wechseln();
    }
  }

  // ── Zeilen-Verwaltung ────────────────────────────────────────────────────
  einnahmeZeileHinzufuegen(): void {
    if (this.istGesperrt()) return;
    const heute = new Date().toISOString().slice(0, 10);
    const neueZeile: BuchhaltungZeile = {
      typ: 'inc',
      name: '',
      datum: heute,
      brutto: 0,
      mwst: 19,
      abzug: 100,
      _tempId: neuesTempId(),
    };
    this._einnahmenZeilen.update((z) => ({
      ...z,
      [this.aktuellerMonat()]: [...(z[this.aktuellerMonat()] ?? []), neueZeile],
    }));
    this._alsDirtyMarkieren();
  }

  ausgabeZeileHinzufuegen(): void {
    if (this.istGesperrt()) return;
    const heute = new Date().toISOString().slice(0, 10);
    const neueZeile: BuchhaltungZeile = {
      typ: 'exp',
      name: '',
      datum: heute,
      brutto: 0,
      mwst: 19,
      abzug: 100,
      kategorie: '',
      _tempId: neuesTempId(),
    };
    this._ausgabenZeilen.update((z) => ({
      ...z,
      [this.aktuellerMonat()]: [...(z[this.aktuellerMonat()] ?? []), neueZeile],
    }));
    this._alsDirtyMarkieren();
  }

  einnahmeZeileAktualisieren(tempId: string, aenderungen: Partial<BuchhaltungZeile>): void {
    if (this.istGesperrt()) return;
    this._einnahmenZeilen.update((z) => ({
      ...z,
      [this.aktuellerMonat()]: (z[this.aktuellerMonat()] ?? []).map((z) =>
        z._tempId === tempId ? { ...z, ...aenderungen } : z,
      ),
    }));
    this._alsDirtyMarkieren();
  }

  ausgabeZeileAktualisieren(tempId: string, aenderungen: Partial<BuchhaltungZeile>): void {
    if (this.istGesperrt()) return;
    this._ausgabenZeilen.update((z) => ({
      ...z,
      [this.aktuellerMonat()]: (z[this.aktuellerMonat()] ?? []).map((z) =>
        z._tempId === tempId ? { ...z, ...aenderungen } : z,
      ),
    }));
    this._alsDirtyMarkieren();
  }

  kategorieAktualisieren(tempId: string, kategorie: string): void {
    if (this.istGesperrt()) return;
    const abzug = KATEGORIEN[kategorie] ?? 100;
    this.ausgabeZeileAktualisieren(tempId, { kategorie, abzug });
  }

  einnahmeZeileEntfernen(tempId: string): void {
    if (this.istGesperrt()) return;
    const zeile = this.aktuelleEinnahmen().find((z) => z._tempId === tempId);
    if (zeile?.id) {
      this.service.eintragLoeschen(zeile.id).subscribe();
    }
    this._einnahmenZeilen.update((z) => ({
      ...z,
      [this.aktuellerMonat()]: (z[this.aktuellerMonat()] ?? []).filter((z) => z._tempId !== tempId),
    }));
    this._alsDirtyMarkieren();
  }

  ausgabeZeileEntfernen(tempId: string): void {
    if (this.istGesperrt()) return;
    const zeile = this.aktuelleAusgaben().find((z) => z._tempId === tempId);
    if (zeile?.id) {
      this.service.eintragLoeschen(zeile.id).subscribe();
    }
    this._ausgabenZeilen.update((z) => ({
      ...z,
      [this.aktuellerMonat()]: (z[this.aktuellerMonat()] ?? []).filter((z) => z._tempId !== tempId),
    }));
    this._alsDirtyMarkieren();
  }

  zeileKopieren(typ: 'inc' | 'exp', tempId: string): void {
    if (this.istGesperrt()) return;
    const heute = new Date().toISOString().slice(0, 10);
    if (typ === 'inc') {
      const zeile = this.aktuelleEinnahmen().find((z) => z._tempId === tempId);
      if (!zeile) return;
      const kopie: BuchhaltungZeile = {
        ...zeile,
        datum: heute,
        id: undefined,
        _tempId: neuesTempId(),
      };
      this._einnahmenZeilen.update((z) => {
        const liste = [...(z[this.aktuellerMonat()] ?? [])];
        const idx = liste.findIndex((z) => z._tempId === tempId);
        liste.splice(idx + 1, 0, kopie);
        return { ...z, [this.aktuellerMonat()]: liste };
      });
    } else {
      const zeile = this.aktuelleAusgaben().find((z) => z._tempId === tempId);
      if (!zeile) return;
      const kopie: BuchhaltungZeile = {
        ...zeile,
        datum: heute,
        id: undefined,
        _tempId: neuesTempId(),
      };
      this._ausgabenZeilen.update((z) => {
        const liste = [...(z[this.aktuellerMonat()] ?? [])];
        const idx = liste.findIndex((z) => z._tempId === tempId);
        liste.splice(idx + 1, 0, kopie);
        return { ...z, [this.aktuellerMonat()]: liste };
      });
    }
    this._alsDirtyMarkieren();
  }

  // ── Speichern ────────────────────────────────────────────────────────────
  async batchSpeichern(): Promise<void> {
    if (this.istGesperrt()) return;
    const monat = this.aktuellerMonat();
    const jahr = this.aktuellesJahr();
    const einnahmen = this._einnahmenZeilen()[monat] ?? [];
    const ausgaben = this._ausgabenZeilen()[monat] ?? [];

    const zeilen: Array<Partial<BuchhaltungEintrag>> = [
      ...einnahmen.map(({ _tempId: _, ...z }) => ({ ...z, typ: 'inc' as const, jahr, monat })),
      ...ausgaben.map(({ _tempId: _, ...z }) => ({ ...z, typ: 'exp' as const, jahr, monat })),
    ];

    this.speicherStatus.set({ dirty: true, speichernLaeuft: true });

    return new Promise((resolve, reject) => {
      this.service.batchSpeichern(jahr, monat, zeilen).subscribe({
        next: (gespeichert) => {
          this._idsNachSpeichernAktualisieren(monat, gespeichert);
          this.service.jahresZusammenfassungLaden(jahr).subscribe({
            next: (zusammenfassung) => {
              this._jahresZusammenfassung.set(zusammenfassung);
              this.speicherStatus.set({ dirty: false, speichernLaeuft: false });
              this.toast.success('Buchhaltung gespeichert.');
              resolve();
            },
            error: (err: Error) => {
              this.speicherStatus.set({ dirty: false, speichernLaeuft: false });
              this.toast.error(`Zusammenfassung konnte nicht geladen werden: ${  err.message}`);
              resolve();
            },
          });
        },
        error: (err: Error) => {
          this.speicherStatus.set({ dirty: true, speichernLaeuft: false });
          this.toast.error(`Speichern fehlgeschlagen: ${  err.message}`);
          reject(err);
        },
      });
    });
  }

  // ── Monat sperren/entsperren ─────────────────────────────────────────────
  lockMonth(): void {
    const monat = this.aktuellerMonat();
    const jahr = this.aktuellesJahr();
    const name = `${MONATE[monat]  } ${  jahr}`;
    this.bestaetigenDialog.set({
      titel: 'Monat sperren',
      nachricht: `${name} sperren? (GoBD §146 AO — keine Änderungen mehr möglich)`,
      aktion: () => {
        const speichernUndSperren = () => {
          this.service.lockMonth(jahr, monat).subscribe({
            next: () => {
              this.gesperrteMonateSet.update((s) => new Set([...s, monat]));
              this.bestaetigenDialog.set(null);
            },
            error: (err: Error) => this.toast.error(`Sperren fehlgeschlagen: ${  err.message}`),
          });
        };
        if (this.speicherStatus().dirty) {
          this.batchSpeichern().then(speichernUndSperren);
        } else {
          speichernUndSperren();
        }
      },
    });
  }

  unlockMonth(): void {
    const monat = this.aktuellerMonat();
    const jahr = this.aktuellesJahr();
    const name = `${MONATE[monat]  } ${  jahr}`;
    this.bestaetigenDialog.set({
      titel: 'Monat entsperren',
      nachricht: `${name} entsperren? Buchungen können dann wieder bearbeitet werden.`,
      aktion: () => {
        this.service.unlockMonth(jahr, monat).subscribe({
          next: () => {
            this.gesperrteMonateSet.update((s) => {
              const neu = new Set(s);
              neu.delete(monat);
              return neu;
            });
            this.bestaetigenDialog.set(null);
          },
          error: (err: Error) => this.toast.error(`Entsperren fehlgeschlagen: ${  err.message}`),
        });
      },
    });
  }

  dialogAbbrechen(): void {
    this.bestaetigenDialog.set(null);
  }

  // ── Wiederkehrende Kosten ────────────────────────────────────────────────
  wiederkehrendeKostenAnwenden(): void {
    if (this.istGesperrt()) return;
    this.service.loadRecurringExpenses().subscribe({
      next: (liste) => {
        const aktive = liste.filter((w) => w.aktiv);
        if (!aktive.length) {
          this.toast.error('Keine aktiven wiederkehrenden Kosten definiert.');
          return;
        }
        const vorhandeneNamen = this.aktuelleAusgaben().map((z) => z.name);
        const hinzuzufuegen = aktive.filter((w) => !vorhandeneNamen.includes(w.name ?? ''));
        if (!hinzuzufuegen.length) return;

        const monat = this.aktuellerMonat();
        const heute = new Date().toISOString().slice(0, 10);
        const neueZeilen: BuchhaltungZeile[] = hinzuzufuegen.map(
          (w): BuchhaltungZeile => ({
            typ: 'exp',
            name: w.name,
            kategorie: w.kategorie,
            brutto: w.brutto,
            mwst: w.mwst,
            abzug: w.abzug,
            belegnr: w.belegnr ?? '',
            datum: heute,
            _tempId: neuesTempId(),
          }),
        );
        this._ausgabenZeilen.update((z) => ({
          ...z,
          [monat]: [...(z[monat] ?? []), ...neueZeilen],
        }));
        this._alsDirtyMarkieren();
        this.batchSpeichern();
      },
      error: (err: Error) =>
        this.toast.error(`Wiederkehrende Kosten konnten nicht geladen werden: ${  err.message}`),
    });
  }

  // ── VST-Tracking ─────────────────────────────────────────────────────────
  vstAlsGezahltMarkieren(schluessel: string): void {
    const heute = new Date().toISOString().slice(0, 10);
    this._vstPaid.update((v) => ({ ...v, [schluessel]: true, [`${schluessel  }_date`]: heute }));
    this._saveVst(schluessel);
  }

  vstZahlungZuruecksetzen(schluessel: string): void {
    this._vstPaid.update((v) => ({ ...v, [schluessel]: false, [`${schluessel  }_date`]: '' }));
    this._saveVst(schluessel);
  }

  // ── Monat leeren ─────────────────────────────────────────────────────────
  monatLeeren(): void {
    if (this.istGesperrt()) return;
    const monat = this.aktuellerMonat();
    const name = MONATE[monat];
    this.bestaetigenDialog.set({
      titel: 'Monat leeren',
      nachricht: `${name} wirklich leeren? Diese Aktion kann nicht rückgängig gemacht werden.`,
      aktion: () => {
        const alleZeilen = [
          ...(this._einnahmenZeilen()[monat] ?? []),
          ...(this._ausgabenZeilen()[monat] ?? []),
        ];
        alleZeilen.forEach((z) => {
          if (z.id) this.service.eintragLoeschen(z.id).subscribe();
        });
        this._einnahmenZeilen.update((z) => ({ ...z, [monat]: [] }));
        this._ausgabenZeilen.update((z) => ({ ...z, [monat]: [] }));
        this.speicherStatus.set({ dirty: false, speichernLaeuft: false });
        this.bestaetigenDialog.set(null);
      },
    });
  }

  // ── Private Hilfsmethoden ────────────────────────────────────────────────
  private _jahresDatenVerarbeiten(jahresDaten: BuchhaltungJahr): void {
    const einnahmen: Record<number, BuchhaltungZeile[]> = {};
    const ausgaben: Record<number, BuchhaltungZeile[]> = {};

    Object.entries(jahresDaten).forEach(([monatStr, monDaten]) => {
      const monat = parseInt(monatStr, 10);
      einnahmen[monat] = (monDaten.inc ?? []).map(eintragZuZeile);
      ausgaben[monat] = (monDaten.exp ?? []).map(eintragZuZeile);
    });

    this._einnahmenZeilen.set(einnahmen);
    this._ausgabenZeilen.set(ausgaben);
    this._jahresDaten.set(jahresDaten);
  }

  private _vstDatenVerarbeiten(vstDaten: VstPaid[]): void {
    const vstMap: Record<string, boolean | string> = {};
    vstDaten.forEach((r) => {
      vstMap[r.quartal] = !!r.paid;
      if (r.datum) vstMap[`${r.quartal  }_date`] = r.datum;
    });
    this._vstPaid.set(vstMap);
  }

  private _saveVst(schluessel: string): void {
    const paid = this._vstPaid();
    this.service
      .saveVst({
        jahr: this.aktuellesJahr(),
        quartal: schluessel,
        paid: !!paid[schluessel],
        datum: (paid[`${schluessel  }_date`] as string) ?? '',
      })
      .subscribe();
  }

  private _idsNachSpeichernAktualisieren(monat: number, gespeichert: BuchhaltungEintrag[]): void {
    this._einnahmenZeilen.update((z) => ({
      ...z,
      [monat]: (z[monat] ?? []).map((zeile) => {
        const match = gespeichert.find(
          (s) =>
            s.typ === 'inc' &&
            (s.id === zeile.id ||
              (s.name === zeile.name && s.datum === zeile.datum && s.brutto === zeile.brutto)),
        );
        return match ? { ...zeile, id: match.id } : zeile;
      }),
    }));
    this._ausgabenZeilen.update((z) => ({
      ...z,
      [monat]: (z[monat] ?? []).map((zeile) => {
        const match = gespeichert.find(
          (s) =>
            s.typ === 'exp' &&
            (s.id === zeile.id ||
              (s.name === zeile.name && s.datum === zeile.datum && s.brutto === zeile.brutto)),
        );
        return match ? { ...zeile, id: match.id } : zeile;
      }),
    }));
  }

  private _monatsDatenBerechnen(monat: number): MonatsDaten {
    return this._monatsDatenAusServerSummary(this._jahresZusammenfassung().months[monat]);
  }

  private _monatsDatenAusServerSummary(summary: AccountingMonthSummary | undefined): MonatsDaten {
    return {
      einnahmenNetto: summary?.incomeNet ?? 0,
      einnahmenUst: summary?.incomeVat ?? 0,
      ausgabenNetto: summary?.expenseNet ?? 0,
      vorsteuer: summary?.inputVat ?? 0,
      zahllast: summary?.vatLiability ?? 0,
      gewinn: summary?.profit ?? 0,
    };
  }

  private _elsterDatenBerechnen(monate: number[]) {
    return (
      this._jahresZusammenfassung().quarters.find((quarter) =>
        quarter.months.every((month) => monate.includes(month)),
      )?.elster ?? { kz81: 0, kz83: 0, kz86: 0, kz85: 0, kz66: 0 }
    );
  }

  private _alsDirtyMarkieren(): void {
    this.speicherStatus.update((s) => ({ ...s, dirty: true }));
  }
}
