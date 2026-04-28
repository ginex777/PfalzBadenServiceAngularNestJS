import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PdfApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  createInvoicePdf(invoiceId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.baseUrl}/pdf/rechnung`, {
      rechnung_id: invoiceId,
    });
  }

  createOfferPdf(offerId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.baseUrl}/pdf/angebot`, {
      angebot_id: offerId,
    });
  }

  createEuerPdf(
    year: number,
    result: unknown,
  ): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.baseUrl}/pdf/euer`, {
      jahr: year,
      ergebnis: result,
    });
  }

  createServiceAssignmentPdf(assignmentId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.baseUrl}/pdf/hausmeister/einsatz`, {
      einsatz_id: assignmentId,
    });
  }

  createServiceMonthlyReportPdf(
    monthIso: string,
    employeeName?: string,
  ): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.baseUrl}/pdf/hausmeister/monat`, {
      monat: monthIso,
      mitarbeiter_name: employeeName,
    });
  }

  createEmployeeStatementPdf(employeeId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.baseUrl}/pdf/mitarbeiter/abrechnung`, {
      mitarbeiter_id: employeeId,
    });
  }

  createChecklistSubmissionPdf(submissionId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(
      `${this.baseUrl}/pdf/checkliste/submission`,
      {
        submission_id: submissionId,
      },
    );
  }

  createContractPdf(contractId: number): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.baseUrl}/vertraege/${contractId}/pdf`, {});
  }
}
