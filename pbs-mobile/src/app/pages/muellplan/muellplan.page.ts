import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  IonToast,
} from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
import { OperationalContextService } from '../../core/operational-context.service';
import { WastePlanService, UpcomingWastePickup, WastePickup } from '../../core/waste-plan.service';

@Component({
  selector: 'app-muellplan',
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
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonList,
    IonBadge,
    IonToast,
  ],
  templateUrl: './muellplan.page.html',
  styleUrl: './muellplan.page.scss',
})
export class MuellplanPage implements OnInit {
  private readonly wastePlan = inject(WastePlanService);
  protected readonly context = inject(OperationalContextService);

  protected readonly objects = this.context.objects;
  protected readonly selectedObjectId = this.context.selectedObjectId;
  protected readonly selectedObject = computed(
    () => this.objects().find((o) => o.id === this.selectedObjectId()) ?? null,
  );

  protected readonly upcomingPickups = signal<UpcomingWastePickup[]>([]);
  protected readonly objectPickups = signal<WastePickup[]>([]);

  protected readonly isLoading = signal(true);
  protected readonly isLoadingPickups = signal(false);
  protected readonly toastMessage = signal('');
  protected readonly toastOpen = signal(false);

  private readonly lastLoadedObjectId = signal<number | null>(null);
  private readonly _pickupsEffect = effect(() => {
    const objectId = this.selectedObjectId();
    if (objectId == null) {
      this.lastLoadedObjectId.set(null);
      this.objectPickups.set([]);
      return;
    }
    if (this.lastLoadedObjectId() === objectId) return;
    this.lastLoadedObjectId.set(objectId);
    this.loadPickupsForObject(objectId);
  });

  ngOnInit(): void {
    this.context.ensureObjectsLoaded();
    this.loadInitial();
  }

  protected refresh(): void {
    this.loadInitial();
  }

  protected selectObject(value: unknown): void {
    const parsed = typeof value === 'number' ? value : value != null ? Number(value) : NaN;
    if (!Number.isFinite(parsed)) {
      this.context.setSelectedObjectId(null);
      return;
    }

    this.context.setSelectedObjectId(parsed);
  }

  protected pickupColor(color: string): string {
    const normalized = color.trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(normalized)) return normalized;
    return '#94a3b8';
  }

  protected isPickupToday(dateValue: string): boolean {
    const date = new Date(dateValue);
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  private loadInitial(): void {
    this.isLoading.set(true);
    this.isLoadingPickups.set(false);

    forkJoin({
      upcoming: this.wastePlan.getUpcoming(14),
    }).subscribe({
      next: ({ upcoming }) => {
        this.upcomingPickups.set(upcoming);
        if (this.selectedObjectId() == null) this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.showToast('Muellplan konnte nicht geladen werden. Bitte erneut versuchen.');
      },
    });
  }

  private loadPickupsForObject(objectId: number): void {
    this.isLoadingPickups.set(true);

    this.wastePlan.getPickupsForObject(objectId).subscribe({
      next: (pickups) => {
        this.objectPickups.set(pickups);
        this.isLoadingPickups.set(false);
        this.isLoading.set(false);
      },
      error: () => {
        this.objectPickups.set([]);
        this.isLoadingPickups.set(false);
        this.isLoading.set(false);
        this.showToast('Termine konnten nicht geladen werden. Bitte erneut versuchen.');
      },
    });
  }

  protected closeToast(): void {
    this.toastOpen.set(false);
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    this.toastOpen.set(true);
  }
}
