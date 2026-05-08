import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { EmployeesApiClient, PdfApiClient } from '../../core/api/clients';
import { BrowserService } from '../../core/services/browser.service';
import { MitarbeiterService } from './mitarbeiter.service';

describe('MitarbeiterService', () => {
  let service: MitarbeiterService;
  const employeesApi = {
    loadEmployees: vi.fn(),
    createEmployee: vi.fn(),
    updateEmployee: vi.fn(),
    deleteEmployee: vi.fn(),
    loadEmployeeHours: vi.fn(),
    createEmployeeHours: vi.fn(),
    updateEmployeeHours: vi.fn(),
    deleteEmployeeHours: vi.fn(),
    clockIn: vi.fn(),
    clockOut: vi.fn(),
    loadTimeTracking: vi.fn(),
  };
  const pdfApi = { createEmployeeStatementPdf: vi.fn() };
  const browser = { openUrl: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MitarbeiterService,
        { provide: EmployeesApiClient, useValue: employeesApi },
        { provide: PdfApiClient, useValue: pdfApi },
        { provide: BrowserService, useValue: browser },
      ],
    });

    service = TestBed.inject(MitarbeiterService);
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('delegates employee, hours, and time-clock operations', async () => {
    employeesApi.loadEmployees.mockReturnValue(of([{ id: 1, name: 'Erika', stundenlohn: 20, aktiv: true }]));
    employeesApi.createEmployee.mockReturnValue(of({ id: 2 }));
    employeesApi.updateEmployee.mockReturnValue(of({ id: 3 }));
    employeesApi.deleteEmployee.mockReturnValue(of(undefined));
    employeesApi.loadEmployeeHours.mockReturnValue(of([{ id: 4 }]));
    employeesApi.createEmployeeHours.mockReturnValue(of({ id: 5 }));
    employeesApi.updateEmployeeHours.mockReturnValue(of({ id: 6 }));
    employeesApi.deleteEmployeeHours.mockReturnValue(of(undefined));
    employeesApi.clockIn.mockReturnValue(of({ id: 7 }));
    employeesApi.clockOut.mockReturnValue(of({ id: 8 }));
    employeesApi.loadTimeTracking.mockReturnValue(of([{ id: 9 }]));

    await firstValueFrom(service.alleLaden());
    await firstValueFrom(service.erstellen({ name: 'Neu' }));
    await firstValueFrom(service.aktualisieren(2, { aktiv: false }));
    await firstValueFrom(service.loeschen(3));
    await firstValueFrom(service.stundenLaden(4));
    await firstValueFrom(service.stundenErstellen(4, { stunden: 2 }));
    await firstValueFrom(service.stundenAktualisieren(5, { bezahlt: true }));
    await firstValueFrom(service.stundenLoeschen(6));
    await firstValueFrom(service.clockIn(7, 'Start'));
    await firstValueFrom(service.clockOut(7));
    await firstValueFrom(service.loadTimeTracking(7));

    expect(employeesApi.clockIn).toHaveBeenCalledWith(7, { notiz: 'Start' });
    expect(employeesApi.loadTimeTracking).toHaveBeenCalledWith(7);
  });

  it('opens employee statement PDFs', async () => {
    pdfApi.createEmployeeStatementPdf.mockReturnValue(of({ url: '/pdf/employee.pdf' }));

    await service.abrechnungPdfOeffnen(12);

    expect(pdfApi.createEmployeeStatementPdf).toHaveBeenCalledWith(12);
    expect(browser.openUrl).toHaveBeenCalledWith('/pdf/employee.pdf');
  });
});
