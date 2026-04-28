import { Component, computed, signal, inject, OnInit } from '@angular/core';
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
import { ObjectContextService } from '../../core/object-context.service';
import { StempelService } from '../../core/stempel.service';
import { TimerStateService } from '../../core/timer-state.service';
import { ObjektKontextComponent } from '../../shared/ui/objekt-kontext/objekt-kontext.component';

@Component({
  selector: 'app-stempeluhr',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonCard,
    IonCardContent,
    IonToast,
    ObjektKontextComponent,
  ],
  templateUrl: './stempeluhr.page.html',
  styleUrl: './stempeluhr.page.scss',
})
export class StempeluhrPage implements OnInit {
  private readonly auth = inject(MobileAuthService);
  private readonly stampService = inject(StempelService);
  protected readonly context = inject(ObjectContextService);
  private readonly timerState = inject(TimerStateService);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly note = signal('');
  readonly isLoading = signal(false);
  readonly statusMessage = signal('');
  readonly statusTone = signal<'success' | 'error' | 'info'>('info');
  readonly toastOpen = signal(false);

  protected readonly canStart = computed(() => {
    return !this.isActive() && !this.isLoading() && this.context.selectedObjectId() != null;
  });

  protected readonly isActive = computed(() => this.timerState.isActive());
  protected readonly runtime = computed(() => this.timerState.runtime());

  private get employeeId(): number {
    return this.auth.currentUser()?.mitarbeiterId ?? 0;
  }

  ngOnInit() {
    this.context.ensureObjectsLoaded();
    this.restoreActiveStamp();
  }

  ionViewWillEnter(): void {
    this.restoreActiveStamp();
  }

  start() {
    if (!this.employeeId) {
      this.setStatus('error', 'Kein Mitarbeiterprofil mit dem Benutzer verknuepft.');
      return;
    }

    const objectId = this.context.selectedObjectId();
    if (objectId == null) {
      this.setStatus('error', 'Bitte ein Objekt auswaehlen.');
      return;
    }

    const selectedObjectName =
      this.context.objects().find((o) => o.id === objectId)?.name ?? null;

    const trimmedNote = this.note().trim();
    const note = trimmedNote ? trimmedNote : undefined;

    this.isLoading.set(true);
    this.stampService.start(this.employeeId, objectId, note).subscribe({
      next: (s) => {
        this.timerState.setActive({ id: s.id, start: new Date(s.start) });
        this.setStatus(
          'success',
          selectedObjectName
            ? `Stempel gestartet: ${selectedObjectName}.`
            : 'Stempel erfolgreich gestartet.',
        );
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
        this.timerState.clearActive();
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


  private setStatus(tone: 'success' | 'error' | 'info', message: string): void {
    this.statusTone.set(tone);
    this.statusMessage.set(message);
    this.toastOpen.set(true);
  }

  private restoreActiveStamp(): void {
    const employeeId = this.employeeId;
    if (!employeeId) return;

    this.stampService.getTimeEntries(employeeId).subscribe({
      next: (entries) => {
        const open = entries.find((e) => e.stop == null) ?? null;
        if (!open) {
          this.timerState.clearActive();
          return;
        }

        this.timerState.setActive({ id: open.id, start: new Date(open.start) });
        if (open.objekt_id != null) {
          this.context.setSelectedObjectId(open.objekt_id);
        }
      },
    });
  }

  protected updateNote(value: string): void {
    this.note.set(value);
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
