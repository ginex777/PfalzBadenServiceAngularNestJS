import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
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
import { forkJoin, of } from 'rxjs';
import { MobileAuthService } from '../../core/auth.service';
import { OperationalContextService } from '../../core/operational-context.service';
import { StempelService, StempelEintrag } from '../../core/stempel.service';
import { WastePlanService, UpcomingWastePickup } from '../../core/waste-plan.service';
import { ObjektAuswahlComponent } from '../../shared/ui/objekt-auswahl/objekt-auswahl.component';

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
    ObjektAuswahlComponent,
  ],
  templateUrl: './tagesuebersicht.page.html',
  styleUrl: './tagesuebersicht.page.scss',
})
export class TagesuebersichtPage implements OnInit {
  private readonly auth = inject(MobileAuthService);
  private readonly router = inject(Router);
  private readonly stempel = inject(StempelService);
  private readonly wastePlanService = inject(WastePlanService);
  protected readonly context = inject(OperationalContextService);

  protected readonly todayEntries = signal<StempelEintrag[]>([]);
  protected readonly upcomingPickups = signal<UpcomingWastePickup[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasEmployeeContext = signal(true);
  protected readonly toastMessage = signal('');
  protected readonly toastOpen = signal(false);

  protected readonly openEntry = computed(() => this.todayEntries().find((entry) => entry.stop == null) ?? null);

  protected readonly totalTrackedMinutes = computed(() =>
    this.todayEntries()
      .filter((entry) => entry.dauer_minuten != null)
      .reduce((sum, entry) => sum + (entry.dauer_minuten ?? 0), 0),
  );

  ngOnInit(): void {
    this.context.ensureObjectsLoaded();
    this.loadDashboardData();
  }

  protected readonly canUseOperativeActions = computed(() => this.context.selectedObjectId() != null);

  protected loadDashboardData(): void {
    const employeeId = this.auth.currentUser()?.mitarbeiterId ?? null;
    this.hasEmployeeContext.set(employeeId != null);
    this.isLoading.set(true);

    const timeEntriesRequest = employeeId
      ? this.stempel.getTimeEntries(employeeId)
      : of<StempelEintrag[]>([]);

    forkJoin({
      timeEntries: timeEntriesRequest,
      upcomingPickups: this.wastePlanService.getUpcoming(6),
    }).subscribe({
      next: ({ timeEntries, upcomingPickups }) => {
        this.todayEntries.set(timeEntries.filter((entry) => this.isCurrentDate(entry.start)));
        this.upcomingPickups.set(upcomingPickups);
        this.isLoading.set(false);
      },
      error: () => {
        this.showToast('Daten konnten nicht geladen werden. Bitte erneut versuchen.');
        this.isLoading.set(false);
      },
    });
  }

  protected isPickupToday(dateValue: string): boolean {
    return this.isCurrentDate(dateValue);
  }

  protected formatDuration(minutes: number | null): string {
    if (minutes == null) return '(running)';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}min` : `${remainingMinutes}min`;
  }

  private isCurrentDate(dateValue: string | Date): boolean {
    const parsedDate = new Date(dateValue);
    const today = new Date();
    return (
      parsedDate.getFullYear() === today.getFullYear() &&
      parsedDate.getMonth() === today.getMonth() &&
      parsedDate.getDate() === today.getDate()
    );
  }

  protected readonly openTasksCount = computed(() => {
    const activeStamp = this.openEntry() ? 1 : 0;
    const pickupsToday = this.upcomingPickups().filter((pickup) =>
      this.isPickupToday(pickup.abholung),
    ).length;
    return activeStamp + pickupsToday;
  });

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }

  protected openTimeClock(): void {
    if (!this.canUseOperativeActions()) {
      this.showToast('Bitte zuerst ein Objekt auswÃ¤hlen.');
      return;
    }
    void this.router.navigate(['/tabs/stempeluhr']);
  }

  protected openPhotoUpload(): void {
    if (!this.canUseOperativeActions()) {
      this.showToast('Bitte zuerst ein Objekt auswÃ¤hlen.');
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

}
