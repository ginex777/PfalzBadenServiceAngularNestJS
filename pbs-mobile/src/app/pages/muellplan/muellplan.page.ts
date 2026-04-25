import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  IonToast,
} from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
import { ObjectContextService } from '../../core/object-context.service';
import { WastePlanService, UpcomingWastePickup, WastePickup } from '../../core/waste-plan.service';
import { ObjektKontextComponent } from '../../shared/ui/objekt-kontext/objekt-kontext.component';

@Component({
  selector: 'app-muellplan',
  standalone: true,
  host: { class: 'ion-page' },
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonList,
    IonBadge,
    IonButton,
    IonRefresher,
    IonRefresherContent,
    IonToast,
    ObjektKontextComponent,
  ],
  templateUrl: './muellplan.page.html',
  styleUrl: './muellplan.page.scss',
})
export class MuellplanPage implements OnInit {
  private readonly wastePlan = inject(WastePlanService);
  protected readonly context = inject(ObjectContextService);

  protected readonly selectedObjectId = this.context.selectedObjectId;
  protected readonly selectedObject = this.context.selectedObject;

  protected readonly upcomingPickups = signal<UpcomingWastePickup[]>([]);
  protected readonly objectPickups = signal<WastePickup[]>([]);

  protected readonly isLoading = signal(true);
  protected readonly isLoadingPickups = signal(false);
  protected readonly markingDoneId = signal<number | null>(null);
  protected readonly toastMessage = signal('');
  protected readonly toastOpen = signal(false);
  protected readonly toastColor = signal<'success' | 'danger'>('success');

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
  }

  ionViewWillEnter(): void {
    this.reloadAll();
  }

  protected handleRefresh(event: CustomEvent): void {
    this.reloadAll(() => (event.target as HTMLIonRefresherElement).complete());
  }

  protected markDone(pickup: WastePickup): void {
    if (pickup.erledigt || this.markingDoneId() !== null) return;
    this.markingDoneId.set(pickup.id);
    this.wastePlan.markPickupDone(pickup.id).subscribe({
      next: (updated) => {
        this.objectPickups.update((list) =>
          list.map((p) => (p.id === updated.id ? updated : p)),
        );
        this.markingDoneId.set(null);
        this.showToast('Abgehakt!', 'success');
      },
      error: () => {
        this.markingDoneId.set(null);
        this.showToast('Fehler beim Abhaken. Bitte erneut versuchen.', 'danger');
      },
    });
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

  protected isPickupDue(dateValue: string): boolean {
    const date = new Date(dateValue);
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today;
  }

  protected closeToast(): void {
    this.toastOpen.set(false);
  }

  private reloadAll(onComplete?: () => void): void {
    this.isLoading.set(true);
    this.lastLoadedObjectId.set(null);

    forkJoin({ upcoming: this.wastePlan.getUpcoming(14) }).subscribe({
      next: ({ upcoming }) => {
        this.upcomingPickups.set(upcoming);
        const objectId = this.selectedObjectId();
        if (objectId == null) {
          this.isLoading.set(false);
          onComplete?.();
        } else {
          this.loadPickupsForObject(objectId, () => {
            this.isLoading.set(false);
            onComplete?.();
          });
        }
      },
      error: () => {
        this.isLoading.set(false);
        onComplete?.();
        this.showToast('Muellplan konnte nicht geladen werden.', 'danger');
      },
    });
  }

  private loadPickupsForObject(objectId: number, onComplete?: () => void): void {
    this.isLoadingPickups.set(true);
    this.lastLoadedObjectId.set(objectId);

    this.wastePlan.getPickupsForObject(objectId).subscribe({
      next: (pickups) => {
        this.objectPickups.set(pickups);
        this.isLoadingPickups.set(false);
        onComplete?.();
      },
      error: () => {
        this.objectPickups.set([]);
        this.isLoadingPickups.set(false);
        onComplete?.();
        this.showToast('Termine konnten nicht geladen werden.', 'danger');
      },
    });
  }

  private showToast(message: string, color: 'success' | 'danger'): void {
    this.toastMessage.set(message);
    this.toastColor.set(color);
    this.toastOpen.set(true);
  }
}
