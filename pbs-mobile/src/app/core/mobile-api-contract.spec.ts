import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { ChecklistService } from './checklist.service';
import { EvidenceService } from './evidence.service';
import { MobileApiConfigService } from './api-config.service';
import { MobileSummaryService } from './mobile-summary.service';
import { ObjectsService } from './objects.service';
import { StempelService } from './stempel.service';
import { WastePlanService } from './waste-plan.service';

describe('mobile API service contract', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChecklistService,
        EvidenceService,
        MobileApiConfigService,
        MobileSummaryService,
        ObjectsService,
        StempelService,
        WastePlanService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(MobileApiConfigService).apiBaseUrl.set('https://api.test');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads selectable objects from the backend object list endpoint', async () => {
    const response = firstValueFrom(TestBed.inject(ObjectsService).getAll());

    const request = httpMock.expectOne('https://api.test/api/objekte/all');
    expect(request.request.method).toBe('GET');
    request.flush([]);

    await expect(response).resolves.toEqual([]);
  });

  it('uses object-scoped muellplan endpoints and payloads', async () => {
    const service = TestBed.inject(WastePlanService);

    const pickups = firstValueFrom(service.getPickupsForObject(7));
    const pickupRequest = httpMock.expectOne('https://api.test/api/muellplan/7');
    expect(pickupRequest.request.method).toBe('GET');
    pickupRequest.flush([]);
    await expect(pickups).resolves.toEqual([]);

    const upcoming = firstValueFrom(service.getUpcoming(3));
    const upcomingRequest = httpMock.expectOne(
      (request) =>
        request.url === 'https://api.test/api/muellplan-upcoming' &&
        request.params.get('limit') === '3',
    );
    expect(upcomingRequest.request.method).toBe('GET');
    upcomingRequest.flush([]);
    await expect(upcoming).resolves.toEqual([]);

    const done = firstValueFrom(service.markPickupDone(9, 'erledigt vor Ort'));
    const doneRequest = httpMock.expectOne('https://api.test/api/muellplan/9/erledigen');
    expect(doneRequest.request.method).toBe('PATCH');
    expect(doneRequest.request.body).toEqual({ kommentar: 'erledigt vor Ort' });
    doneRequest.flush({
      id: 9,
      objekt_id: 7,
      muellart: 'Papier',
      farbe: '#2563eb',
      abholung: '2026-05-02',
      erledigt: true,
    });
    await expect(done).resolves.toEqual({
      id: 9,
      objectId: 7,
      wasteType: 'Papier',
      color: '#2563eb',
      pickupDate: '2026-05-02',
      isDone: true,
      isToday: false,
      isDue: false,
    });
  });

  it('loads mobile dashboard summary from the backend-owned summary endpoint', async () => {
    const response = firstValueFrom(
      TestBed.inject(MobileSummaryService).getDashboardSummary({ objectId: 7, limit: 6 }),
    );

    const request = httpMock.expectOne(
      (req) =>
        req.url === 'https://api.test/api/mobile/dashboard-summary' &&
        req.params.get('objectId') === '7' &&
        req.params.get('limit') === '6',
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      scope: 'selected-object',
      objectId: 7,
      today: '2026-05-02',
      openPointsCount: 1,
      activeStamp: null,
      activeStampStatus: 'inactive',
      todayEntries: [],
      totalTrackedMinutes: 0,
      upcomingPickups: [],
    });

    await expect(response).resolves.toMatchObject({
      scope: 'selected-object',
      objectId: 7,
      openPointsCount: 1,
    });
  });

  it('submits checklist answers to the backend submission endpoint', async () => {
    const payload = {
      templateId: 5,
      objectId: 7,
      note: 'per App',
      answers: [{ fieldId: 'photo', value: 99 }],
    };
    const response = firstValueFrom(TestBed.inject(ChecklistService).submitChecklist(payload));

    const request = httpMock.expectOne('https://api.test/api/checklisten/submissions');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ id: 41 });

    await expect(response).resolves.toEqual({ id: 41 });
  });

  it('loads object checklist templates from the scoped template endpoint', async () => {
    const response = firstValueFrom(TestBed.inject(ChecklistService).getTemplatesForObject(7));

    const request = httpMock.expectOne('https://api.test/api/checklisten/templates/for-object/7');
    expect(request.request.method).toBe('GET');
    request.flush([]);

    await expect(response).resolves.toEqual([]);
  });

  it('uses evidence list and upload endpoints with backend field names', async () => {
    const service = TestBed.inject(EvidenceService);

    const list = firstValueFrom(service.list({ objectId: 7, page: 2, pageSize: 10 }));
    const listRequest = httpMock.expectOne(
      (request) =>
        request.url === 'https://api.test/api/nachweise' &&
        request.params.get('objectId') === '7' &&
        request.params.get('page') === '2' &&
        request.params.get('pageSize') === '10',
    );
    expect(listRequest.request.method).toBe('GET');
    listRequest.flush({ data: [], total: 0, page: 2, pageSize: 10 });
    await expect(list).resolves.toEqual({ data: [], total: 0, page: 2, pageSize: 10 });

    const upload = firstValueFrom(
      service.upload({
        objectId: 7,
        note: '  Eingang dokumentiert  ',
        photo: new Blob(['photo'], { type: 'image/jpeg' }),
        filename: 'mobile.jpg',
      }),
    );
    const uploadRequest = httpMock.expectOne('https://api.test/api/nachweise/upload');
    expect(uploadRequest.request.method).toBe('POST');
    expect(uploadRequest.request.body.get('objectId')).toBe('7');
    expect(uploadRequest.request.body.get('note')).toBe('Eingang dokumentiert');
    expect(uploadRequest.request.body.get('photo')).toBeInstanceOf(File);
    uploadRequest.flush({
      id: 11,
      objekt_id: 7,
      mitarbeiter_id: 3,
      filename: 'mobile.jpg',
      mimetype: 'image/jpeg',
      filesize: 5,
      sha256: 'hash-1',
      notiz: 'Eingang dokumentiert',
      erstellt_am: '2026-05-02T10:15:00.000Z',
      erstellt_von: 'employee@example.test',
      erstellt_von_name: 'Erika Einsatz',
    });

    await expect(upload).resolves.toMatchObject({
      id: 11,
      objectId: 7,
      note: 'Eingang dokumentiert',
    });
  });

  it('uses employee time-clock endpoint URLs and payloads', async () => {
    const service = TestBed.inject(StempelService);

    const start = firstValueFrom(service.start(3, 7, 'Beginn'));
    const startRequest = httpMock.expectOne('https://api.test/api/mitarbeiter/3/stempel/start');
    expect(startRequest.request.method).toBe('POST');
    expect(startRequest.request.body).toEqual({ objektId: 7, notiz: 'Beginn' });
    startRequest.flush({
      id: 12,
      mitarbeiter_id: 3,
      objekt_id: 7,
      start: '2026-05-02T08:00:00.000Z',
      stop: null,
      dauer_minuten: null,
      notiz: 'Beginn',
    });
    await expect(start).resolves.toMatchObject({ id: 12, objectId: 7 });

    const stop = firstValueFrom(service.stop(3));
    const stopRequest = httpMock.expectOne('https://api.test/api/mitarbeiter/3/stempel/stop');
    expect(stopRequest.request.method).toBe('POST');
    expect(stopRequest.request.body).toEqual({});
    stopRequest.flush({
      id: 12,
      mitarbeiter_id: 3,
      objekt_id: 7,
      start: '2026-05-02T08:00:00.000Z',
      stop: '2026-05-02T09:00:00.000Z',
      dauer_minuten: 60,
      notiz: 'Beginn',
    });
    await expect(stop).resolves.toMatchObject({ durationMinutes: 60 });

    const history = firstValueFrom(service.getTimeEntries(3));
    const historyRequest = httpMock.expectOne('https://api.test/api/mitarbeiter/3/zeiterfassung');
    expect(historyRequest.request.method).toBe('GET');
    historyRequest.flush([]);
    await expect(history).resolves.toEqual([]);

    const active = firstValueFrom(service.getActiveStamp(3));
    const activeRequest = httpMock.expectOne('https://api.test/api/mitarbeiter/3/stempel/aktiv');
    expect(activeRequest.request.method).toBe('GET');
    activeRequest.flush(null);
    await expect(active).resolves.toBeNull();
  });
});
