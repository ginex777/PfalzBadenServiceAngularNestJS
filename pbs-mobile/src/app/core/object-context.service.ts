import { Injectable, computed, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { finalize } from 'rxjs/operators';
import { ObjectListItem, ObjectsService } from './objects.service';

const SELECTED_OBJECT_KEY_PREFIX = 'selected_object_id';

function selectedObjectKey(userEmail: string): string {
  return `${SELECTED_OBJECT_KEY_PREFIX}:${userEmail.trim().toLowerCase()}`;
}

@Injectable({ providedIn: 'root' })
export class ObjectContextService {
  private readonly objectsApi = inject(ObjectsService);
  private selectedObjectStorageKey: string | null = null;

  readonly objects = signal<ObjectListItem[]>([]);
  readonly objectsLoading = signal(false);
  readonly objectsError = signal<string | null>(null);

  readonly selectedObjectId = signal<number | null>(null);
  readonly selectedObject = computed(
    () => this.objects().find((o) => o.id === this.selectedObjectId()) ?? null,
  );

  readonly activeObjects = computed(() =>
    this.objects().filter((o) => (o.status ?? 'AKTIV') !== 'INAKTIV'),
  );

  ensureObjectsLoaded(): void {
    if (this.objectsLoading()) return;
    if (this.objects().length > 0) return;

    this.objectsLoading.set(true);
    this.objectsError.set(null);
    this.objectsApi
      .getAll()
      .pipe(finalize(() => this.objectsLoading.set(false)))
      .subscribe({
        next: (rows) => {
          this.objects.set(rows);
        },
        error: () => {
          this.objects.set([]);
          this.objectsError.set('Objekte konnten nicht geladen werden.');
        },
      });
  }

  reloadObjects(): void {
    if (this.objectsLoading()) return;
    this.objects.set([]);
    this.ensureObjectsLoaded();
  }

  setSelectedObjectId(objectId: number | null): void {
    this.selectedObjectId.set(objectId);
    void this.persistSelectedObjectId(objectId);
  }

  async restoreSelectedObjectForUser(userEmail: string): Promise<void> {
    this.selectedObjectStorageKey = selectedObjectKey(userEmail);
    const { value } = await Preferences.get({ key: this.selectedObjectStorageKey });
    const objectId = value ? Number(value) : NaN;
    this.selectedObjectId.set(Number.isInteger(objectId) && objectId > 0 ? objectId : null);
  }

  async clearSelectedObjectForUser(userEmail: string): Promise<void> {
    await Preferences.remove({ key: selectedObjectKey(userEmail) });
    if (this.selectedObjectStorageKey === selectedObjectKey(userEmail)) {
      this.selectedObjectId.set(null);
    }
  }

  resetSessionState(): void {
    this.selectedObjectStorageKey = null;
    this.selectedObjectId.set(null);
    this.objects.set([]);
    this.objectsError.set(null);
    this.objectsLoading.set(false);
  }

  private async persistSelectedObjectId(objectId: number | null): Promise<void> {
    if (!this.selectedObjectStorageKey) return;
    if (objectId == null) {
      await Preferences.remove({ key: this.selectedObjectStorageKey });
      return;
    }
    await Preferences.set({ key: this.selectedObjectStorageKey, value: String(objectId) });
  }
}
