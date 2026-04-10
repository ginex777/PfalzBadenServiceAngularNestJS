import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import {
  Rechnung, Angebot, MuellplanTermin,
  Benachrichtigung, BackupInfo, BuchhaltungJahr, HausmeisterEinsatz,
} from '../../core/models';

export interface DashboardRohdaten {
  rechnungen: Rechnung[];
  angebote: Angebot[];
  muellTermine: MuellplanTermin[];
  benachrichtigungen: Benachrichtigung[];
  backupInfo: BackupInfo | null;
  buchhaltung: BuchhaltungJahr;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  rohdatenLaden(jahr: number): Observable<DashboardRohdaten> {
    return new Observable(observer => {
      forkJoin({
        rechnungen: this.api.rechnungenLaden(),
        angebote: this.api.angeboteLaden(),
        muellTermine: this.api.muellplanAnstehendeTermineLaden(5),
        benachrichtigungen: this.api.benachrichtigungenLaden(),
        buchhaltung: this.api.buchhaltungLaden(jahr),
      }).subscribe({
        next: daten => {
          this.api.letztesBackupLaden().subscribe({
            next: backup => observer.next({ ...daten, backupInfo: backup }),
            error: () => observer.next({ ...daten, backupInfo: null }),
            complete: () => observer.complete(),
          });
        },
        error: err => observer.error(err),
      });
    });
  }

  benachrichtigungAlsGelesenMarkieren(id: number): Observable<void> {
    return this.api.benachrichtigungAlsGelesenMarkieren(id);
  }

  alleBenachrichtigungenAlsGelesenMarkieren(): Observable<void> {
    return this.api.alleBenachrichtigungenAlsGelesenMarkieren();
  }

  benachrichtigungenNeuLaden(): Observable<Benachrichtigung[]> {
    return this.api.benachrichtigungenLaden();
  }

  hausmeisterEinsaetzeLaden(): Observable<HausmeisterEinsatz[]> {
    return this.api.hausmeisterEinsaetzeLaden();
  }

  backupErstellen(): Observable<BackupInfo> {
    return this.api.backupErstellen();
  }
}
