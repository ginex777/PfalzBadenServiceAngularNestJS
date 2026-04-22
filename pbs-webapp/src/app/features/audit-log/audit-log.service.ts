import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { AuditLogEntry, PaginatedResponse } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly api = inject(ApiService);

  loadTables(): Observable<string[]> {
    return this.api.loadAuditLogTables();
  }

  loadPage(query: {
    page: number;
    pageSize: number;
    q?: string;
    aktion?: string;
    tabelle?: string;
  }): Observable<PaginatedResponse<AuditLogEntry>> {
    return this.api.loadAuditLogPage(query);
  }

  alleLaden(): Observable<AuditLogEntry[]> {
    return this.api.loadAuditLogAll();
  }
  fuerTabelleLaden(tabelle: string): Observable<AuditLogEntry[]> {
    return this.api.loadAuditLogForTable(tabelle);
  }
}
