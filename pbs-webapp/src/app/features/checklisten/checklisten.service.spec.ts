import { TestBed } from '@angular/core/testing';
import { of, firstValueFrom } from 'rxjs';
import { ChecklistsApiClient, ObjectsApiClient } from '../../core/api/clients';
import { ChecklistenService } from './checklisten.service';

describe('ChecklistenService', () => {
  it('loads mobile-created checklist submissions for the web list', async () => {
    TestBed.configureTestingModule({
      providers: [
        ChecklistenService,
        { provide: ObjectsApiClient, useValue: { loadObjects: () => of([]) } },
        {
          provide: ChecklistsApiClient,
          useValue: {
            loadChecklistSubmissionsPage: () =>
              of({
                data: [
                  {
                    id: 41,
                    submittedAt: '2026-05-02T11:00:00.000Z',
                    object: { id: 7, name: 'Objekt Mitte' },
                    template: { id: 5, name: 'Kontrolle', version: 2 },
                    employee: { id: 3, name: 'Erika Einsatz' },
                    createdByEmail: 'employee@example.test',
                    createdByName: 'Erika Einsatz',
                    note: 'per Mobile App',
                  },
                ],
                total: 1,
                page: 1,
                pageSize: 25,
              }),
            loadChecklistSubmission: () => of({}),
          },
        },
      ],
    });

    const service = TestBed.inject(ChecklistenService);
    const page = await firstValueFrom(service.loadSubmissionsPage({ page: 1, pageSize: 25 }));

    expect(page.data[0].id).toBe(41);
    expect(page.data[0].object.name).toBe('Objekt Mitte');
    expect(page.data[0].employee?.name).toBe('Erika Einsatz');
    expect(page.data[0].createdByEmail).toBe('employee@example.test');
  });

  it('loads mobile checklist detail with foto evidence answer ids intact', async () => {
    TestBed.configureTestingModule({
      providers: [
        ChecklistenService,
        { provide: ObjectsApiClient, useValue: { loadObjects: () => of([]) } },
        {
          provide: ChecklistsApiClient,
          useValue: {
            loadChecklistSubmissionsPage: () => of({ data: [], total: 0, page: 1, pageSize: 25 }),
            loadChecklistSubmission: () =>
              of({
                id: 41,
                submittedAt: '2026-05-02T11:00:00.000Z',
                object: { id: 7, name: 'Objekt Mitte' },
                template: { id: 5, name: 'Kontrolle', version: 2 },
                employee: { id: 3, name: 'Erika Einsatz' },
                createdByEmail: 'employee@example.test',
                createdByName: 'Erika Einsatz',
                note: null,
                templateSnapshot: {
                  fields: [{ fieldId: 'photo', label: 'Foto', type: 'foto' }],
                },
                answers: [{ fieldId: 'photo', value: 99 }],
              }),
          },
        },
      ],
    });

    const service = TestBed.inject(ChecklistenService);
    const detail = await firstValueFrom(service.loadSubmission(41));

    expect(detail.answers).toEqual([{ fieldId: 'photo', value: 99 }]);
  });
});
