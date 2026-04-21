import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Kunde, Vertrag } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class VertraegeService {
  private readonly api = inject(ApiService);

  loadCustomers(): Observable<Kunde[]> {
    return this.api.loadCustomers();
  }
  loadContracts(kundenId?: number): Observable<Vertrag[]> {
    return this.api.loadContracts(kundenId);
  }
  createContract(daten: Partial<Vertrag>): Observable<Vertrag> {
    return this.api.createContract(daten);
  }
  updateContract(id: number, daten: Partial<Vertrag>): Observable<Vertrag> {
    return this.api.updateContract(id, daten);
  }
  deleteContract(id: number): Observable<void> {
    return this.api.deleteContract(id);
  }
  createContractPdf(id: number): Observable<{ token: string; url: string }> {
    return this.api.createContractPdf(id);
  }
}
