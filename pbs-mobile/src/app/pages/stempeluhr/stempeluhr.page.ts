import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MobileAuthService } from '../../core/auth.service';
import { StempelService } from '../../core/stempel.service';

@Component({
  selector: 'app-stempeluhr',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './stempeluhr.page.html',
  styleUrl: './stempeluhr.page.scss',
})
export class StempeluhrPage implements OnInit, OnDestroy {
  private readonly auth = inject(MobileAuthService);
  private readonly stempel = inject(StempelService);

  readonly user = this.auth.currentUser;
  offenerStempel = signal<{ id: number; start: Date } | null>(null);
  laufzeit = signal('00:00:00');
  laedt = signal(false);
  meldung = signal('');

  private _timer?: ReturnType<typeof setInterval>;
  // Hardcoded for demo — in production read from Mitarbeiter linked to user
  private mitarbeiterId = 1;

  ngOnInit() {
    this._timer = setInterval(() => this._updateLaufzeit(), 1000);
  }

  ngOnDestroy() {
    if (this._timer) clearInterval(this._timer);
  }

  get istAktiv(): boolean {
    return !!this.offenerStempel();
  }

  start() {
    this.laedt.set(true);
    this.stempel.start(this.mitarbeiterId).subscribe({
      next: (s) => {
        this.offenerStempel.set({ id: s.id, start: new Date(s.start) });
        this.meldung.set('Stempel gestartet');
        this.laedt.set(false);
        setTimeout(() => this.meldung.set(''), 3000);
      },
      error: () => { this.laedt.set(false); this.meldung.set('Fehler beim Starten'); },
    });
  }

  stop() {
    this.laedt.set(true);
    this.stempel.stop(this.mitarbeiterId).subscribe({
      next: (s) => {
        const min = s.dauer_minuten ?? 0;
        this.offenerStempel.set(null);
        this.laufzeit.set('00:00:00');
        this.meldung.set(`Gestoppt — ${min} Minuten erfasst`);
        this.laedt.set(false);
        setTimeout(() => this.meldung.set(''), 4000);
      },
      error: () => { this.laedt.set(false); this.meldung.set('Fehler beim Stoppen'); },
    });
  }

  async abmelden() {
    await this.auth.logout();
  }

  private _updateLaufzeit() {
    const start = this.offenerStempel()?.start;
    if (!start) return;
    const diff = Math.floor((Date.now() - start.getTime()) / 1000);
    const h = Math.floor(diff / 3600).toString().padStart(2, '0');
    const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    this.laufzeit.set(`${h}:${m}:${s}`);
  }
}
