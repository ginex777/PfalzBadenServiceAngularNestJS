import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/angular/standalone';
import { MobileAuthService } from '../../core/auth.service';
import { StempelService } from '../../core/stempel.service';

@Component({
  selector: 'app-stempeluhr',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonCard, IonCardContent, IonToast],
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
  selectedObject = signal('');
  isLoading = signal(false);
  statusMessage = signal('');
  statusTone = signal<'success' | 'error' | 'info'>('info');
  toastOpen = signal(false);

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
      this.setStatus('error', 'Kein Mitarbeiterprofil mit dem Benutzer verknuepft.');
      return;
    }
    const objectName = this.selectedObject().trim();

    this.isLoading.set(true);
    const note = objectName ? `Objekt: ${objectName}` : undefined;
    this.stampService.start(this.employeeId, note).subscribe({
      next: (s) => {
        this.openStamp.set({ id: s.id, start: new Date(s.start) });
        const successMessage = objectName
          ? `Stempel erfolgreich gestartet fuer ${objectName}.`
          : 'Stempel erfolgreich gestartet.';
        this.setStatus('success', successMessage);
        this.isLoading.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.isLoading.set(false);
        this.setStatus(
          'error',
          error?.error?.message ?? 'Starten fehlgeschlagen. Bitte erneut versuchen.',
        );
      },
    });
  }

  stop() {
    if (!this.employeeId) {
      this.setStatus('error', 'Kein Mitarbeiterprofil mit dem Benutzer verknuepft.');
      return;
    }

    this.isLoading.set(true);
    this.stampService.stop(this.employeeId).subscribe({
      next: (s) => {
        const min = s.dauer_minuten ?? 0;
        this.openStamp.set(null);
        this.runtime.set('00:00:00');
        this.setStatus('success', `Gestoppt. ${min} Minuten erfasst.`);
        this.isLoading.set(false);
      },
      error: (error: { error?: { message?: string } }) => {
        this.isLoading.set(false);
        this.setStatus(
          'error',
          error?.error?.message ?? 'Stoppen fehlgeschlagen. Bitte erneut versuchen.',
        );
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

  private setStatus(tone: 'success' | 'error' | 'info', message: string): void {
    this.statusTone.set(tone);
    this.statusMessage.set(message);
    this.toastOpen.set(true);
  }

  protected updateObject(value: string): void {
    this.selectedObject.set(value);
  }

  protected closeToast(): void {
    this.toastOpen.set(false);
  }

  protected toastColor(): 'success' | 'danger' | 'medium' {
    if (this.statusTone() === 'success') return 'success';
    if (this.statusTone() === 'error') return 'danger';
    return 'medium';
  }
}
