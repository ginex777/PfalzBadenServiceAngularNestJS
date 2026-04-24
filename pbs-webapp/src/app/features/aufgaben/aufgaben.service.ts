import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../../core/models';
import { TaskListItemApi, TaskListQuery, TaskUpdatePayload } from './aufgaben.models';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/aufgaben';

  list(query: TaskListQuery): Observable<PaginatedResponse<TaskListItemApi>> {
    let params = new HttpParams()
      .set('page', String(Math.max(1, query.page)))
      .set('pageSize', String(Math.max(1, query.pageSize)));

    const q = query.q?.trim();
    if (q) params = params.set('q', q);

    if (typeof query.objectId === 'number') params = params.set('objectId', String(query.objectId));
    if (typeof query.customerId === 'number') params = params.set('customerId', String(query.customerId));
    if (typeof query.employeeId === 'number') params = params.set('employeeId', String(query.employeeId));
    if (typeof query.userId === 'number') params = params.set('userId', String(query.userId));

    if (query.type && query.type.length > 0) params = params.set('type', query.type.join(','));
    if (query.status && query.status.length > 0) params = params.set('status', query.status.join(','));

    if (query.createdFrom) params = params.set('createdFrom', query.createdFrom);
    if (query.createdTo) params = params.set('createdTo', query.createdTo);
    if (query.dueFrom) params = params.set('dueFrom', query.dueFrom);
    if (query.dueTo) params = params.set('dueTo', query.dueTo);

    return this.http.get<PaginatedResponse<TaskListItemApi>>(this.baseUrl, { params });
  }

  update(id: number, payload: TaskUpdatePayload): Observable<TaskListItemApi> {
    return this.http.put<TaskListItemApi>(`${this.baseUrl}/${id}`, payload);
  }
}
