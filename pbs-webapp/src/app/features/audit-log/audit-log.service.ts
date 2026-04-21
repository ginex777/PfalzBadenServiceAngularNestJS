import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { AuditLogEntry } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly api = inject(ApiService);

  alleLaden(): Observable<AuditLogEntry[]> {
    return this.api.loadAuditLogAll();
  }
  fuerTabelleLaden(tabelle: string): Observable<AuditLogEntry[]> {
    return this.api.loadAuditLogForTable(tabelle);
  }
}
