import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLogEntry } from '../models';
import { API_BASE_URL } from '../tokens';

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private readonly http = inject(HttpClient);
  private readonly basis = inject(API_BASE_URL);

  allesLaden(): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${this.basis}/audit/all`);
  }
  fuerTabelleLaden(tabelle: string): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${this.basis}/audit/${tabelle}/all`);
  }
  fuerDatensatzLaden(tabelle: string, id: number): Observable<AuditLogEntry[]> {
    return this.http.get<AuditLogEntry[]>(`${this.basis}/audit/${tabelle}/${id}`);
  }
}
