import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SmtpSettings, UserAktualisierenPayload, UserAnlegenPayload, UserEintrag } from '../../core/api/api.contract';
import { BackupInfo, FirmaSettings } from '../../core/models';
import { BackupApiClient, EmailApiClient, SettingsApiClient, SmtpApiClient, UsersApiClient } from '../../core/api/clients';

export type { SmtpSettings, UserEintrag, UserAnlegenPayload, UserAktualisierenPayload };

@Injectable({ providedIn: 'root' })
export class EinstellungenService {
  private readonly settingsApi = inject(SettingsApiClient);
  private readonly backupApi = inject(BackupApiClient);
  private readonly smtpApi = inject(SmtpApiClient);
  private readonly emailApi = inject(EmailApiClient);
  private readonly usersApi = inject(UsersApiClient);

  firmaLaden(): Observable<FirmaSettings> {
    return this.settingsApi.loadSettings('firma');
  }
  firmaSpeichern(daten: FirmaSettings): Observable<FirmaSettings> {
    return this.settingsApi.saveSettings('firma', daten);
  }
  createBackup(): Observable<BackupInfo> {
    return this.backupApi.createBackup();
  }
  loadLastBackup(): Observable<BackupInfo> {
    return this.backupApi.loadLastBackup();
  }
  loadBackupFiles(): Observable<BackupInfo[]> {
    return this.backupApi.loadBackupFiles();
  }

  loadSmtp(): Observable<SmtpSettings> {
    return this.smtpApi.loadSmtp();
  }
  saveSmtp(daten: SmtpSettings): Observable<SmtpSettings> {
    return this.smtpApi.saveSmtp(daten);
  }
  smtpTesten(): Observable<{ success: boolean; message?: string }> {
    return this.emailApi.testEmail();
  }

  userListeLaden(): Observable<UserEintrag[]> {
    return this.usersApi.loadUsers();
  }
  createUser(payload: UserAnlegenPayload): Observable<UserEintrag> {
    return this.usersApi.createUser(payload);
  }
  updateUser(id: string, daten: UserAktualisierenPayload): Observable<UserEintrag> {
    return this.usersApi.updateUser(id, daten);
  }
  deleteUser(id: string): Observable<void> {
    return this.usersApi.deleteUser(id);
  }
}
