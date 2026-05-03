import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmailApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  testEmail(): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(`${this.baseUrl}/email/test`, {});
  }
}

