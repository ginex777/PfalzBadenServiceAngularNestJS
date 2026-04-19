import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SucheService } from './suche.service';
import { ToastService } from '../../core/services/toast.service';
import { Rechnung, Angebot, Kunde, MarketingKontakt } from '../../core/models';
import { SucheErgebnis } from './suche.models';

@Injectable({ providedIn: 'root' })
export class SucheFacade {
  private readonly service = inject(SucheService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly laedt = signal(false);
  readonly suchbegriff = signal('');
  readonly daten = signal<SucheErgebnis>({ rechnungen: [], angebote: [], kunden: [], marketing: [], hausmeister: [] });

  readonly ergebnisse = computed(() => {
    const q = this.suchbegriff().toLowerCase().trim();
    if (q.length < 2) return { rechnungen: [], angebote: [], kunden: [], marketing: [], hausmeister: [], gesamt: 0 };
    const d = this.daten();
    const rechnungen = d.rechnungen.filter(r =>
      r.nr.toLowerCase().includes(q) || r.empf.toLowerCase().includes(q) || (r.titel ?? '').toLowerCase().includes(q)
    );
    const angebote = d.angebote.filter(a =>
      a.nr.toLowerCase().includes(q) || a.empf.toLowerCase().includes(q) || (a.titel ?? '').toLowerCase().includes(q)
    );
    const kunden = d.kunden.filter(k =>
      k.name.toLowerCase().includes(q) || (k.email ?? '').toLowerCase().includes(q) || (k.ort ?? '').toLowerCase().includes(q)
    );
    const marketing = d.marketing.filter(m =>
      m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.person ?? '').toLowerCase().includes(q)
    );
    const hausmeister = d.hausmeister.filter(e =>
      e.mitarbeiter_name.toLowerCase().includes(q) ||
      (e.kunden_name ?? '').toLowerCase().includes(q) ||
      e.taetigkeiten.some(t => t.beschreibung.toLowerCase().includes(q))
    );
    return { rechnungen, angebote, kunden, marketing, hausmeister, gesamt: rechnungen.length + angebote.length + kunden.length + marketing.length + hausmeister.length };
  });

  ladeDaten(): void {
    this.laedt.set(true);
    this.service.alleLaden().subscribe({
      next: d => { this.daten.set(d); this.laedt.set(false); },
      error: () => { this.toast.error('Daten konnten nicht geladen werden.'); this.laedt.set(false); },
    });
  }

  suchbegriffSetzen(q: string): void { this.suchbegriff.set(q); }

  zuRechnung(id: number): void { this.router.navigate(['/rechnungen'], { queryParams: { id } }); }
  zuAngebot(id: number): void { this.router.navigate(['/angebote'], { queryParams: { id } }); }
  zuKunde(id: number): void { this.router.navigate(['/kunden'], { queryParams: { id } }); }
  zuMarketing(id: number): void { this.router.navigate(['/marketing'], { queryParams: { id } }); }
  zuHausmeister(): void { this.router.navigate(['/hausmeister']); }
}
