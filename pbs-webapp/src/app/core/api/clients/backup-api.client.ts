import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackupInfo } from '../../models';

@Injectable({ providedIn: 'root' })
export class BackupApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  createBackup(): Observable<BackupInfo> {
    return this.http.post<BackupInfo>(`${this.baseUrl}/backup`, {});
  }

  loadLastBackup(): Observable<BackupInfo> {
    return this.http.get<BackupInfo>(`${this.baseUrl}/backup/last`);
  }

  loadBackupFiles(): Observable<BackupInfo[]> {
    return this.http.get<BackupInfo[]>(`${this.baseUrl}/backup/files`);
  }
}

