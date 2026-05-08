import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MuellplanApiClient, ObjectsApiClient } from '../../core/api/clients';
import { BrowserService } from '../../core/services/browser.service';
import { MuellplanService } from './muellplan.service';

describe('MuellplanService', () => {
  let service: MuellplanService;
  const objectsApi = {
    loadObjects: vi.fn(),
    updateObject: vi.fn(),
  };
  const muellplanApi = {
    loadGarbageTemplates: vi.fn(),
    loadGarbagePlan: vi.fn(),
    loadUpcomingGarbageTerms: vi.fn(),
    createGarbageTerm: vi.fn(),
    updateGarbageTerm: vi.fn(),
    deleteGarbageTerm: vi.fn(),
    createGarbageTemplate: vi.fn(),
    deleteGarbageTemplate: vi.fn(),
    uploadGarbageTemplatePdf: vi.fn(),
    getGarbageTemplatePdfUrl: vi.fn(),
    createObjectGarbagePdf: vi.fn(),
    copyGarbageTerms: vi.fn(),
    markGarbageTermDone: vi.fn(),
    loadGarbageCompletionHistory: vi.fn(),
    createMonthlyClosurePdf: vi.fn(),
  };
  const browser = { openUrl: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MuellplanService,
        { provide: ObjectsApiClient, useValue: objectsApi },
        { provide: MuellplanApiClient, useValue: muellplanApi },
        { provide: BrowserService, useValue: browser },
      ],
    });

    service = TestBed.inject(MuellplanService);
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loads objects and templates together', async () => {
    objectsApi.loadObjects.mockReturnValue(of([{ id: 1 }]));
    muellplanApi.loadGarbageTemplates.mockReturnValue(of([{ id: 2 }]));

    await expect(firstValue(service.allesDatenLaden())).resolves.toEqual({
      objekte: [{ id: 1 }],
      vorlagen: [{ id: 2 }],
    });
  });

  it('forwards garbage-plan operations to API clients', async () => {
    const file = new File(['pdf'], 'plan.pdf', { type: 'application/pdf' });
    objectsApi.updateObject.mockReturnValue(of({ id: 1 }));
    muellplanApi.loadGarbagePlan.mockReturnValue(of([{ id: 2 }]));
    muellplanApi.loadUpcomingGarbageTerms.mockReturnValue(of([{ id: 3 }]));
    muellplanApi.createGarbageTerm.mockReturnValue(of({ id: 4 }));
    muellplanApi.updateGarbageTerm.mockReturnValue(of({ id: 5 }));
    muellplanApi.deleteGarbageTerm.mockReturnValue(of(undefined));
    muellplanApi.createGarbageTemplate.mockReturnValue(of({ id: 6 }));
    muellplanApi.deleteGarbageTemplate.mockReturnValue(of(undefined));
    muellplanApi.uploadGarbageTemplatePdf.mockReturnValue(of({ ok: true, pdf_name: 'plan.pdf' }));
    muellplanApi.getGarbageTemplatePdfUrl.mockReturnValue('/pdf/template');
    muellplanApi.createObjectGarbagePdf.mockReturnValue(of(undefined));
    muellplanApi.copyGarbageTerms.mockReturnValue(of(undefined));
    muellplanApi.markGarbageTermDone.mockReturnValue(of({ id: 7 }));
    muellplanApi.loadGarbageCompletionHistory.mockReturnValue(of({ data: [], total: 0, page: 1, pageSize: 50 }));

    await firstValue(service.termineLaden(1));
    await firstValue(service.anstehendeTermineLaden());
    await firstValue(service.updateObject(1, { name: 'Objekt' }));
    await firstValue(service.terminErstellen({ objekt_id: 1 }));
    await firstValue(service.terminAktualisieren(2, { erledigt: true }));
    await firstValue(service.terminLoeschen(3));
    await firstValue(service.vorlageErstellen({ name: 'Vorlage' }));
    await firstValue(service.vorlageLoeschen(4));
    await firstValue(service.vorlagePdfHochladen(5, file));
    await firstValue(service.pdfErstellen(6));
    await firstValue(service.termineKopieren(7, 8));
    await firstValue(service.markTerminDone(9, 'done'));
    await firstValue(service.loadCompletionHistory(10));

    expect(service.vorlagePdfUrl(5)).toBe('/pdf/template');
    expect(muellplanApi.loadGarbagePlan).toHaveBeenCalledWith(1);
    expect(muellplanApi.loadUpcomingGarbageTerms).toHaveBeenCalledWith(5);
    expect(objectsApi.updateObject).toHaveBeenCalledWith(1, { name: 'Objekt' });
    expect(muellplanApi.copyGarbageTerms).toHaveBeenCalledWith(7, 8);
    expect(muellplanApi.markGarbageTermDone).toHaveBeenCalledWith(9, 'done');
  });

  it('opens monthly closure PDFs only when the backend returns a URL', async () => {
    muellplanApi.createMonthlyClosurePdf.mockResolvedValueOnce({ url: '/pdf/month.pdf' });
    await service.monatsabschlussPdfOeffnen(11);

    muellplanApi.createMonthlyClosurePdf.mockResolvedValueOnce({});
    await service.monatsabschlussPdfOeffnen(12);

    expect(muellplanApi.createMonthlyClosurePdf).toHaveBeenCalledWith(11, expect.stringMatching(/^\d{4}-\d{2}$/));
    expect(browser.openUrl).toHaveBeenCalledTimes(1);
    expect(browser.openUrl).toHaveBeenCalledWith('/pdf/month.pdf');
  });
});

function firstValue<T>(source: import('rxjs').Observable<T>): Promise<T> {
  return new Promise((resolve, reject) => source.subscribe({ next: resolve, error: reject }));
}
