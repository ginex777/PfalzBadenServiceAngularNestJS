import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { UserAktualisierenPayload, UserAnlegenPayload, UserEintrag } from '../api.contract';

@Injectable({ providedIn: 'root' })
export class UsersApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadUsers(): Observable<UserEintrag[]> {
    return this.http.get<UserEintrag[]>(`${this.baseUrl}/auth/users`);
  }

  createUser(payload: UserAnlegenPayload): Observable<UserEintrag> {
    return this.http.post<UserEintrag>(`${this.baseUrl}/auth/users`, payload);
  }

  updateUser(id: string, data: UserAktualisierenPayload): Observable<UserEintrag> {
    return this.http.patch<UserEintrag>(`${this.baseUrl}/auth/users/${id}`, data);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/auth/users/${id}`);
  }
}

