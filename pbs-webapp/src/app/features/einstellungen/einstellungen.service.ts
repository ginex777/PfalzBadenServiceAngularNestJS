import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { FirmaSettings } from '../../core/models';

interface SmtpSettings { host: string; port: number; secure: boolean; user: string; pass: string; fromName?: string; }

@Injectable({ providedIn: 'root' })
export class EinstellungenService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  firmaLaden(): Observable<FirmaSettings> { return this.api.einstellungenLaden('firma'); }
  firmaSpeichern(daten: FirmaSettings): Observable<FirmaSettings> { return this.api.einstellungenSpeichern('firma', daten); }
  backupErstellen(): Observable<unknown> { return this.api.backupErstellen(); }
  letztesBackupLaden(): Observable<unknown> { return this.api.letztesBackupLaden(); }
  backupDateienLaden(): Observable<unknown> { return this.api.backupDateienLaden(); }

  smtpLaden(): Observable<SmtpSettings> {
    return this.http.get<SmtpSettings>('/api/settings/smtp');
  }

  smtpSpeichern(daten: SmtpSettings): Observable<SmtpSettings> {
    return this.http.post<SmtpSettings>('/api/settings/smtp', daten);
  }

  smtpTesten(): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>('/api/email/test', {});
  }
}
