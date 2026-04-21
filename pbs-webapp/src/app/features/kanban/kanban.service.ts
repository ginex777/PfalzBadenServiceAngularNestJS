import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Task, TaskReorderUpdate } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class KanbanService {
  private readonly api = inject(ApiService);

  alleLaden(): Observable<Task[]> {
    return this.api.loadTasks();
  }
  erstellen(daten: Partial<Task>): Observable<Task> {
    return this.api.createTask(daten);
  }
  aktualisieren(id: number, daten: Partial<Task>): Observable<Task> {
    return this.api.updateTask(id, daten);
  }
  loeschen(id: number): Observable<void> {
    return this.api.deleteTask(id);
  }
  neuAnordnen(updates: TaskReorderUpdate[]): Observable<void> {
    return this.api.reorderTasks(updates);
  }
}
