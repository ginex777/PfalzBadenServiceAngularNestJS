import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, SmtpSettings, UserEintrag, UserAnlegenPayload, UserAktualisierenPayload } from '../../core/api/api.service';
import { FirmaSettings } from '../../core/models';

export type { SmtpSettings, UserEintrag, UserAnlegenPayload, UserAktualisierenPayload };

@Injectable({ providedIn: 'root' })
export class EinstellungenService {
  private readonly api = inject(ApiService);

  firmaLaden(): Observable<FirmaSettings> { return this.api.einstellungenLaden('firma'); }
  firmaSpeichern(daten: FirmaSettings): Observable<FirmaSettings> { return this.api.einstellungenSpeichern('firma', daten); }
  backupErstellen(): Observable<unknown> { return this.api.backupErstellen(); }
  letztesBackupLaden(): Observable<unknown> { return this.api.letztesBackupLaden(); }
  backupDateienLaden(): Observable<unknown> { return this.api.backupDateienLaden(); }

  smtpLaden(): Observable<SmtpSettings> { return this.api.smtpLaden(); }
  smtpSpeichern(daten: SmtpSettings): Observable<SmtpSettings> { return this.api.smtpSpeichern(daten); }
  smtpTesten(): Observable<{ success: boolean; message?: string }> { return this.api.emailTesten(); }

  userListeLaden(): Observable<UserEintrag[]> { return this.api.usersLaden(); }
  userAnlegen(payload: UserAnlegenPayload): Observable<UserEintrag> { return this.api.userAnlegen(payload); }
  userAktualisieren(id: string, daten: UserAktualisierenPayload): Observable<UserEintrag> { return this.api.userAktualisieren(id, daten); }
  userLoeschen(id: string): Observable<void> { return this.api.userLoeschen(id); }
}
