import { TestBed } from '@angular/core/testing';
import { of, firstValueFrom } from 'rxjs';
import { MobileFeedbackApiClient, ObjectsApiClient } from '../../core/api/clients';
import { MobileRueckmeldungenService } from './mobile-rueckmeldungen.service';

describe('MobileRueckmeldungenService', () => {
  it('loads mobile evidence and checklist feedback rows for the web feedback list', async () => {
    TestBed.configureTestingModule({
      providers: [
        MobileRueckmeldungenService,
        { provide: ObjectsApiClient, useValue: { loadObjects: () => of([]) } },
        {
          provide: MobileFeedbackApiClient,
          useValue: {
            loadMobileFeedbackPage: () =>
              of({
                data: [
                  {
                    kind: 'EVIDENCE',
                    id: 11,
                    createdAt: '2026-05-02T10:15:00.000Z',
                    objectId: 7,
                    objectName: 'Objekt Mitte',
                    title: 'Foto hochgeladen',
                    subtitle: 'Treppenhaus dokumentiert',
                    link: '/operativ/nachweise',
                    createdByEmail: 'employee@example.test',
                    createdByName: 'Erika Einsatz',
                  },
                  {
                    kind: 'CHECKLIST',
                    id: 41,
                    createdAt: '2026-05-02T11:00:00.000Z',
                    objectId: 7,
                    objectName: 'Objekt Mitte',
                    title: 'Checkliste eingereicht',
                    subtitle: 'Kontrolle',
                    link: '/operativ/checklisten',
                    createdByEmail: 'employee@example.test',
                    createdByName: 'Erika Einsatz',
                  },
                ],
                total: 2,
                page: 1,
                pageSize: 25,
              }),
          },
        },
      ],
    });

    const service = TestBed.inject(MobileRueckmeldungenService);
    const page = await firstValueFrom(service.loadFeedbackPage({ page: 1, pageSize: 25 }));

    expect(page.data.map((item) => item.kind)).toEqual(['EVIDENCE', 'CHECKLIST']);
    expect(page.data[0].objectName).toBe('Objekt Mitte');
    expect(page.data[1].createdByEmail).toBe('employee@example.test');
  });
});
