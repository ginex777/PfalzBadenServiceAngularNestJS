import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Beleg } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class BelegeService {
  private readonly api = inject(ApiService);

  alleLaden(jahr?: number): Observable<Beleg[]> { return this.api.belegeLaden(jahr); }
  hochladen(formData: FormData): Observable<Beleg> { return this.api.belegHochladen(formData); }
  notizAktualisieren(id: number, notiz: string): Observable<Beleg> { return this.api.belegNotizAktualisieren(id, notiz); }
  loeschen(id: number): Observable<void> { return this.api.belegLoeschen(id); }
  downloadUrl(id: number, inline = false): string { return this.api.belegDownloadUrl(id, inline); }
}
