import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { SmtpSettings } from '../api.contract';

@Injectable({ providedIn: 'root' })
export class SmtpApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadSmtp(): Observable<SmtpSettings> {
    return this.http.get<SmtpSettings>(`${this.baseUrl}/settings/smtp`);
  }

  saveSmtp(data: SmtpSettings): Observable<SmtpSettings> {
    return this.http.post<SmtpSettings>(`${this.baseUrl}/settings/smtp`, data);
  }
}

