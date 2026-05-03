import { TestBed } from '@angular/core/testing';
import { of, firstValueFrom } from 'rxjs';
import { EvidenceApiClient, ObjectsApiClient } from '../../core/api/clients';
import { NachweiseService } from './nachweise.service';

describe('NachweiseService', () => {
  it('maps mobile-created evidence rows for the web evidence list', async () => {
    TestBed.configureTestingModule({
      providers: [
        NachweiseService,
        {
          provide: ObjectsApiClient,
          useValue: { loadObjects: () => of([]) },
        },
        {
          provide: EvidenceApiClient,
          useValue: {
            loadEvidencePage: () =>
              of({
                data: [
                  {
                    id: 11,
                    objekt_id: 7,
                    mitarbeiter_id: 3,
                    filename: 'mobile-photo.jpg',
                    mimetype: 'image/jpeg',
                    filesize: 12345,
                    sha256: 'hash-1',
                    notiz: 'Treppenhaus dokumentiert',
                    erstellt_am: '2026-05-02T10:15:00.000Z',
                    erstellt_von: 'employee@example.test',
                    erstellt_von_name: 'Erika Einsatz',
                  },
                ],
                total: 1,
                page: 1,
                pageSize: 25,
              }),
            getEvidenceDownloadUrl: () => '/api/nachweise/11/download?inline=1',
            uploadEvidence: () => of({}),
          },
        },
      ],
    });

    const service = TestBed.inject(NachweiseService);
    const page = await firstValueFrom(service.loadEvidencePage({ page: 1, pageSize: 25 }));

    expect(page.data[0]).toEqual({
      id: 11,
      objectId: 7,
      employeeId: 3,
      filename: 'mobile-photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 12345,
      sha256: 'hash-1',
      note: 'Treppenhaus dokumentiert',
      createdAt: '2026-05-02T10:15:00.000Z',
      createdByEmail: 'employee@example.test',
      createdByName: 'Erika Einsatz',
    });
  });
});
