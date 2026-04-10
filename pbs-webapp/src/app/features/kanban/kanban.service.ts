import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Task, TaskReorderUpdate } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class KanbanService {
  private readonly api = inject(ApiService);

  alleLaden(): Observable<Task[]> { return this.api.tasksLaden(); }
  erstellen(daten: Partial<Task>): Observable<Task> { return this.api.taskErstellen(daten); }
  aktualisieren(id: number, daten: Partial<Task>): Observable<Task> { return this.api.taskAktualisieren(id, daten); }
  loeschen(id: number): Observable<void> { return this.api.taskLoeschen(id); }
  neuAnordnen(updates: TaskReorderUpdate[]): Observable<void> { return this.api.tasksNeuAnordnen(updates); }
}
