import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ObjectListItem, ObjectsService } from './objects.service';

@Injectable({ providedIn: 'root' })
export class ObjectContextService {
  private readonly objectsApi = inject(ObjectsService);

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
  }
}
