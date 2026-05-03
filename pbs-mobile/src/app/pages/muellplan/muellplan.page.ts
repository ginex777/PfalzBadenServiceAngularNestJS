import { Component, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  IonToast,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { MobileAuthService } from '../../core/auth.service';
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
    IonButtons,
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
  private readonly auth = inject(MobileAuthService);
  private readonly router = inject(Router);
  private readonly wastePlan = inject(WastePlanService);
  private readonly destroyRef = inject(DestroyRef);
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
  private pickupsRequestGen = 0;
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
    if (pickup.isDone || this.markingDoneId() !== null) return;
    this.markingDoneId.set(pickup.id);
    this.wastePlan.markPickupDone(pickup.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        this.objectPickups.update((list) =>
          list.map((p) => (p.id === updated.id ? updated : p)),
        );
        this.upcomingPickups.update((list) => list.filter((p) => p.id !== updated.id));
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

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }

  protected closeToast(): void {
    this.toastOpen.set(false);
  }

  private reloadAll(onComplete?: () => void): void {
    this.isLoading.set(true);
    const objectId = this.selectedObjectId();
    this.lastLoadedObjectId.set(objectId);

    this.wastePlan.getUpcoming(14).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (upcoming) => {
        this.upcomingPickups.set(upcoming);
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
        this.showToast('Müllplan konnte nicht geladen werden.', 'danger');
      },
    });
  }

  private loadPickupsForObject(objectId: number, onComplete?: () => void): void {
    this.isLoadingPickups.set(true);
    this.lastLoadedObjectId.set(objectId);
    const gen = ++this.pickupsRequestGen;

    this.wastePlan.getPickupsForObject(objectId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (pickups) => {
        if (gen !== this.pickupsRequestGen) return;
        this.objectPickups.set(pickups);
        this.isLoadingPickups.set(false);
        onComplete?.();
      },
      error: () => {
        if (gen !== this.pickupsRequestGen) return;
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
