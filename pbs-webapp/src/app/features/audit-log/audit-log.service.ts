import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AuditLogEntry, PaginatedResponse } from '../../core/models';
import { AuditLogApiClient } from '../../core/api/clients';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly auditLogApi = inject(AuditLogApiClient);

  loadTables(): Observable<string[]> {
    return this.auditLogApi.loadAuditLogTables();
  }

  loadPage(query: {
    page: number;
    pageSize: number;
    q?: string;
    aktion?: string;
    tabelle?: string;
  }): Observable<PaginatedResponse<AuditLogEntry>> {
    return this.auditLogApi.loadAuditLogPage(query);
  }

  alleLaden(): Observable<AuditLogEntry[]> {
    return this.auditLogApi.loadAuditLogAll();
  }
  fuerTabelleLaden(tabelle: string): Observable<AuditLogEntry[]> {
    return this.auditLogApi.loadAuditLogForTable(tabelle);
  }
}
