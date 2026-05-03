import { Component, DestroyRef, computed, effect, signal, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonToast,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { MobileAuthService } from '../../core/auth.service';
import {
  MobileSummaryService,
  type MobileDashboardSummary,
} from '../../core/mobile-summary.service';
import { ObjectContextService } from '../../core/object-context.service';
import type { StampEntry } from '../../core/stempel.service';
import type { UpcomingWastePickup } from '../../core/waste-plan.service';
import { ObjektKontextComponent } from '../../shared/ui/objekt-kontext/objekt-kontext.component';

@Component({
  selector: 'app-tagesuebersicht',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonToast,
    ObjektKontextComponent,
  ],
  templateUrl: './tagesuebersicht.page.html',
  styleUrl: './tagesuebersicht.page.scss',
})
export class TagesuebersichtPage implements OnInit {
  private readonly auth = inject(MobileAuthService);
  private readonly router = inject(Router);
  private readonly mobileSummary = inject(MobileSummaryService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly context = inject(ObjectContextService);

  protected readonly dashboardSummary = signal<MobileDashboardSummary | null>(
    null,
  );
  protected readonly todayEntries = signal<StampEntry[]>([]);
  protected readonly upcomingPickups = signal<UpcomingWastePickup[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasEmployeeContext = signal(true);
  protected readonly toastMessage = signal('');
  protected readonly toastOpen = signal(false);
  private readonly viewActive = signal(false);

  private readonly _sessionResetEffect = effect(() => {
    this.auth.sessionResetVersion();
    this.resetPageState();
  });

  private readonly _selectedObjectEffect = effect(() => {
    this.context.selectedObjectId();
    if (this.viewActive()) {
      this.loadDashboardData();
    }
  });

  protected readonly openEntry = computed(
    () => this.dashboardSummary()?.activeStamp ?? null,
  );

  protected readonly totalTrackedMinutes = computed(
    () => this.dashboardSummary()?.totalTrackedMinutes ?? 0,
  );

  ngOnInit(): void {
    this.context.ensureObjectsLoaded();
  }

  ionViewWillEnter(): void {
    this.viewActive.set(true);
  }

  ionViewDidLeave(): void {
    this.viewActive.set(false);
  }

  protected readonly canUseOperativeActions = computed(
    () => this.context.selectedObjectId() != null,
  );

  protected loadDashboardData(): void {
    const employeeId = this.auth.currentUser()?.mitarbeiterId ?? null;
    this.hasEmployeeContext.set(employeeId != null);
    this.isLoading.set(true);
    const objectId = this.selectedObjectId();

    this.mobileSummary.getDashboardSummary({ objectId, limit: 6 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (summary) => {
        this.dashboardSummary.set(summary);
        this.todayEntries.set(summary.todayEntries);
        this.upcomingPickups.set(summary.upcomingPickups);
        this.isLoading.set(false);
      },
      error: () => {
        this.showToast(
          'Daten konnten nicht geladen werden. Bitte erneut versuchen.',
        );
        this.isLoading.set(false);
      },
    });
  }

  protected formatDuration(minutes: number | null): string {
    if (minutes == null) return '(running)';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}min` : `${remainingMinutes}min`;
  }

  protected readonly selectedObjectId = this.context.selectedObjectId;

  protected readonly openTasksCount = computed(
    () => this.dashboardSummary()?.openPointsCount ?? 0,
  );

  protected readonly dashboardScopeLabel = computed(() =>
    this.dashboardSummary()?.scope === 'accessible-objects'
      ? 'Alle zugewiesenen Objekte'
      : 'Ausgewähltes Objekt',
  );

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }

  protected openTimeClock(): void {
    if (!this.canUseOperativeActions()) {
      this.showToast('Bitte zuerst ein Objekt auswählen.');
      return;
    }
    void this.router.navigate(['/tabs/stempeluhr']);
  }

  protected openPhotoUpload(): void {
    if (!this.canUseOperativeActions()) {
      this.showToast('Bitte zuerst ein Objekt auswählen.');
      return;
    }
    void this.router.navigate(['/tabs/foto-upload']);
  }

  protected closeToast(): void {
    this.toastOpen.set(false);
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    this.toastOpen.set(true);
  }

  private resetPageState(): void {
    this.dashboardSummary.set(null);
    this.todayEntries.set([]);
    this.upcomingPickups.set([]);
    this.isLoading.set(false);
    this.hasEmployeeContext.set(true);
    this.toastMessage.set('');
    this.toastOpen.set(false);
  }
}
