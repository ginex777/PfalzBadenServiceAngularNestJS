import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiService,
  SmtpSettings,
  UserEintrag,
  UserAnlegenPayload,
  UserAktualisierenPayload,
} from '../../core/api/api.service';
import { FirmaSettings } from '../../core/models';

export type { SmtpSettings, UserEintrag, UserAnlegenPayload, UserAktualisierenPayload };

@Injectable({ providedIn: 'root' })
export class EinstellungenService {
  private readonly api = inject(ApiService);

  firmaLaden(): Observable<FirmaSettings> {
    return this.api.loadSettings('firma');
  }
  firmaSpeichern(daten: FirmaSettings): Observable<FirmaSettings> {
    return this.api.saveSettings('firma', daten);
  }
  createBackup(): Observable<unknown> {
    return this.api.createBackup();
  }
  loadLastBackup(): Observable<unknown> {
    return this.api.loadLastBackup();
  }
  loadBackupFiles(): Observable<unknown> {
    return this.api.loadBackupFiles();
  }

  loadSmtp(): Observable<SmtpSettings> {
    return this.api.loadSmtp();
  }
  saveSmtp(daten: SmtpSettings): Observable<SmtpSettings> {
    return this.api.saveSmtp(daten);
  }
  smtpTesten(): Observable<{ success: boolean; message?: string }> {
    return this.api.testEmail();
  }

  userListeLaden(): Observable<UserEintrag[]> {
    return this.api.loadUsers();
  }
  createUser(payload: UserAnlegenPayload): Observable<UserEintrag> {
    return this.api.createUser(payload);
  }
  updateUser(id: string, daten: UserAktualisierenPayload): Observable<UserEintrag> {
    return this.api.updateUser(id, daten);
  }
  deleteUser(id: string): Observable<void> {
    return this.api.deleteUser(id);
  }
}
