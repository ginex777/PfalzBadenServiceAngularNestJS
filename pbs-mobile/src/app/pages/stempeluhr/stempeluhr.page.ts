import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { MobileAuthService } from '../../core/auth.service';
import { StempelService } from '../../core/stempel.service';

@Component({
  selector: 'app-stempeluhr',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonButton],
  templateUrl: './stempeluhr.page.html',
  styleUrl: './stempeluhr.page.scss',
})
export class StempeluhrPage implements OnInit, OnDestroy {
  private readonly auth = inject(MobileAuthService);
  private readonly stampService = inject(StempelService);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;
  openStamp = signal<{ id: number; start: Date } | null>(null);
  runtime = signal('00:00:00');
  isLoading = signal(false);
  message = signal('');

  private timer?: ReturnType<typeof setInterval>;

  private get employeeId(): number {
    return this.auth.currentUser()?.mitarbeiterId ?? 0;
  }

  ngOnInit() {
    this.timer = setInterval(() => this.updateRuntime(), 1000);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  get isActive(): boolean {
    return !!this.openStamp();
  }

  start() {
    if (!this.employeeId) {
      this.message.set('Kein Mitarbeiterprofil mit dem Benutzer verknuepft');
      return;
    }

    this.isLoading.set(true);
    this.stampService.start(this.employeeId).subscribe({
      next: (s) => {
        this.openStamp.set({ id: s.id, start: new Date(s.start) });
        this.message.set('Stempel gestartet');
        this.isLoading.set(false);
        setTimeout(() => this.message.set(''), 3000);
      },
      error: () => {
        this.isLoading.set(false);
        this.message.set('Fehler beim Starten');
      },
    });
  }

  stop() {
    if (!this.employeeId) {
      this.message.set('Kein Mitarbeiterprofil mit dem Benutzer verknuepft');
      return;
    }

    this.isLoading.set(true);
    this.stampService.stop(this.employeeId).subscribe({
      next: (s) => {
        const min = s.dauer_minuten ?? 0;
        this.openStamp.set(null);
        this.runtime.set('00:00:00');
        this.message.set(`Gestoppt - ${min} Minuten erfasst`);
        this.isLoading.set(false);
        setTimeout(() => this.message.set(''), 4000);
      },
      error: () => {
        this.isLoading.set(false);
        this.message.set('Fehler beim Stoppen');
      },
    });
  }

  async logout() {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }

  private updateRuntime() {
    const start = this.openStamp()?.start;
    if (!start) return;

    const diff = Math.floor((Date.now() - start.getTime()) / 1000);
    const h = Math.floor(diff / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((diff % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    this.runtime.set(`${h}:${m}:${s}`);
  }
}
