import { TestBed } from '@angular/core/testing';
import { of, firstValueFrom } from 'rxjs';
import { ChecklistsApiClient, ObjectsApiClient } from '../../core/api/clients';
import { ChecklistenService } from './checklisten.service';

describe('ChecklistenService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

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

  it('delegates template, object, submission, and pdf operations to the checklist API clients', async () => {
    const objectsApi = {
      loadObjects: vi.fn(() => of([{ id: 7, name: 'Objekt Mitte' }])),
    };
    const checklistsApi = {
      loadChecklistTemplatesAll: vi.fn(() =>
        of([{ id: 5, name: 'Kontrolle', version: 2, fields: [], isActive: true }]),
      ),
      loadChecklistTemplatesPage: vi.fn(() =>
        of({
          data: [{ id: 5, name: 'Kontrolle', version: 2, fields: [], isActive: true }],
          total: 1,
          page: 1,
          pageSize: 25,
        }),
      ),
      createChecklistTemplate: vi.fn(() => of({ id: 9, name: 'Neu', version: 1, fields: [], isActive: true })),
      updateChecklistTemplate: vi.fn(() => of({ id: 9, name: 'Aktiv', version: 2, fields: [], isActive: true })),
      assignChecklistTemplateObjects: vi.fn(() => of({ ok: true })),
      loadChecklistTemplatesForObject: vi.fn(() =>
        of([{ id: 5, name: 'Kontrolle', version: 2, fields: [], isActive: true }]),
      ),
      loadChecklistSubmissionsPage: vi.fn(() => of({ data: [], total: 0, page: 1, pageSize: 25 })),
      loadChecklistSubmission: vi.fn(() =>
        of({
          id: 41,
          submittedAt: '2026-05-02T11:00:00.000Z',
          object: { id: 7, name: 'Objekt Mitte' },
          template: { id: 5, name: 'Kontrolle', version: 2 },
          employee: null,
          createdByEmail: 'office@example.test',
          createdByName: 'Office',
          note: null,
          templateSnapshot: { fields: [] },
          answers: [],
        }),
      ),
      createChecklistSubmissionPdf: vi.fn(() => of({ token: 'pdf-token', url: '/pdf/checklists/41' })),
    };

    TestBed.configureTestingModule({
      providers: [
        ChecklistenService,
        { provide: ObjectsApiClient, useValue: objectsApi },
        { provide: ChecklistsApiClient, useValue: checklistsApi },
      ],
    });

    const service = TestBed.inject(ChecklistenService);
    const templatePayload = { name: 'Neu', fields: [], isActive: true };

    await firstValueFrom(service.loadObjectsAll());
    await firstValueFrom(service.loadTemplatesAll());
    await firstValueFrom(service.loadTemplatesPage({ page: 1, pageSize: 25, q: 'kontrolle' }));
    await firstValueFrom(service.createTemplate(templatePayload));
    await firstValueFrom(service.updateTemplate(9, { name: 'Aktiv' }));
    await firstValueFrom(service.assignObjectsToTemplate(9, [7, 8]));
    await firstValueFrom(service.loadTemplatesForObject(7));
    await firstValueFrom(service.loadSubmissionsPage({ page: 1, pageSize: 25, objectId: 7, templateId: 5 }));
    await firstValueFrom(service.loadSubmission(41));
    const pdf = await firstValueFrom(service.createSubmissionPdf(41));

    expect(objectsApi.loadObjects).toHaveBeenCalled();
    expect(checklistsApi.loadChecklistTemplatesAll).toHaveBeenCalled();
    expect(checklistsApi.loadChecklistTemplatesPage).toHaveBeenCalledWith({ page: 1, pageSize: 25, q: 'kontrolle' });
    expect(checklistsApi.createChecklistTemplate).toHaveBeenCalledWith(templatePayload);
    expect(checklistsApi.updateChecklistTemplate).toHaveBeenCalledWith(9, { name: 'Aktiv' });
    expect(checklistsApi.assignChecklistTemplateObjects).toHaveBeenCalledWith(9, [7, 8]);
    expect(checklistsApi.loadChecklistTemplatesForObject).toHaveBeenCalledWith(7);
    expect(checklistsApi.loadChecklistSubmissionsPage).toHaveBeenCalledWith({
      page: 1,
      pageSize: 25,
      objectId: 7,
      templateId: 5,
    });
    expect(checklistsApi.loadChecklistSubmission).toHaveBeenCalledWith(41);
    expect(checklistsApi.createChecklistSubmissionPdf).toHaveBeenCalledWith(41);
    expect(pdf.url).toBe('/pdf/checklists/41');
  });
});
