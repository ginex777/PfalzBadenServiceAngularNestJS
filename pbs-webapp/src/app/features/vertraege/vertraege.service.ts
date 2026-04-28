import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Kunde, Vertrag } from '../../core/models';
import { ContractsApiClient, CustomersApiClient, PdfApiClient } from '../../core/api/clients';

@Injectable({ providedIn: 'root' })
export class VertraegeService {
  private readonly customersApi = inject(CustomersApiClient);
  private readonly contractsApi = inject(ContractsApiClient);
  private readonly pdfApi = inject(PdfApiClient);

  loadCustomers(): Observable<Kunde[]> {
    return this.customersApi.loadCustomers();
  }
  loadContracts(kundenId?: number): Observable<Vertrag[]> {
    return this.contractsApi.loadContracts(kundenId);
  }
  createContract(daten: Partial<Vertrag>): Observable<Vertrag> {
    return this.contractsApi.createContract(daten);
  }
  updateContract(id: number, daten: Partial<Vertrag>): Observable<Vertrag> {
    return this.contractsApi.updateContract(id, daten);
  }
  deleteContract(id: number): Observable<void> {
    return this.contractsApi.deleteContract(id);
  }
  createContractPdf(id: number): Observable<{ token: string; url: string }> {
    return this.pdfApi.createContractPdf(id);
  }
}
