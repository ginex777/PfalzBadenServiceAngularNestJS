import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Beleg } from '../../models';
import { PaginatedResponse } from '../../models';

@Injectable({ providedIn: 'root' })
export class ReceiptsApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  loadReceipts(year?: number): Observable<Beleg[]> {
    let params = new HttpParams().set('pageSize', '1000');
    if (year) params = params.set('jahr', String(year));
    return this.http
      .get<PaginatedResponse<Beleg>>(`${this.baseUrl}/belege`, { params })
      .pipe(map((r) => r.data));
  }

  loadReceipt(id: number): Observable<Beleg> {
    return this.http.get<Beleg>(`${this.baseUrl}/belege/${id}`);
  }

  loadReceiptsForEntry(accountingEntryId: number): Observable<Beleg[]> {
    return this.http.get<Beleg[]>(`${this.baseUrl}/belege/buchhaltung/${accountingEntryId}`);
  }

  uploadReceipt(formData: FormData): Observable<Beleg> {
    return this.http.post<Beleg>(`${this.baseUrl}/belege/upload`, formData);
  }

  updateReceiptNote(id: number, note: string): Observable<Beleg> {
    return this.http.patch<Beleg>(`${this.baseUrl}/belege/${id}/notiz`, { notiz: note });
  }

  deleteReceipt(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/belege/${id}`);
  }

  getReceiptDownloadUrl(id: number, inline = false): string {
    return `${this.baseUrl}/belege/${id}/download${inline ? '?inline=1' : ''}`;
  }
}
