import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { WasteObject, WastePlanService } from './waste-plan.service';

const STORAGE_KEY = 'pbs-mobile.selectedObjectId';

function readStoredObjectId(): number | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

@Injectable({ providedIn: 'root' })
export class OperationalContextService {
  private readonly wastePlan = inject(WastePlanService);

  readonly objects = signal<WasteObject[]>([]);
  readonly objectsLoading = signal(false);
  readonly objectsError = signal<string | null>(null);

  readonly selectedObjectId = signal<number | null>(readStoredObjectId());
  readonly selectedObject = computed(
    () => this.objects().find((o) => o.id === this.selectedObjectId()) ?? null,
  );

  ensureObjectsLoaded(): void {
    if (this.objectsLoading()) return;
    if (this.objects().length > 0) return;

    this.objectsLoading.set(true);
    this.objectsError.set(null);
    this.wastePlan
      .getObjectsAll()
      .pipe(finalize(() => this.objectsLoading.set(false)))
      .subscribe({
        next: (rows) => {
          this.objects.set(rows);
          if (this.selectedObjectId() == null && rows.length > 0) {
            this.setSelectedObjectId(rows[0]!.id);
          }
        },
        error: () => {
          this.objects.set([]);
          this.objectsError.set('Objekte konnten nicht geladen werden.');
        },
      });
  }

  setSelectedObjectId(objectId: number | null): void {
    if (objectId == null) {
      this.selectedObjectId.set(null);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    this.selectedObjectId.set(objectId);
    localStorage.setItem(STORAGE_KEY, String(objectId));
  }
}

