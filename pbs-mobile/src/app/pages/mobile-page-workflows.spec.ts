import { signal, computed, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ChecklistService, type ChecklistTemplate, type CreateChecklistSubmissionRequest } from '../core/checklist.service';
import { EvidenceService, type EvidenceListItem } from '../core/evidence.service';
import { MobileAuthService, type AuthUser } from '../core/auth.service';
import { ObjectContextService } from '../core/object-context.service';
import { type ObjectListItem } from '../core/objects.service';
import { PhotoCaptureService } from '../core/photo-capture.service';
import { StempelService, type StampEntry } from '../core/stempel.service';
import { TimerStateService, type ActiveStamp } from '../core/timer-state.service';
import { WastePlanService, type UpcomingWastePickup, type WastePickup } from '../core/waste-plan.service';
import { ChecklistenPage } from './checklisten/checklisten.page';
import { FotoUploadPage } from './foto-upload/foto-upload.page';
import { LoginPage } from './login/login.page';
import { MuellplanPage } from './muellplan/muellplan.page';
import { ObjektAuswahlPage } from './objekt-auswahl/objekt-auswahl.page';
import { StempeluhrPage } from './stempeluhr/stempeluhr.page';

class MockRouter {
  navigate = vi.fn(async () => true);
  navigateByUrl = vi.fn(async () => true);
}

class MockAuthService {
  readonly currentUser = signal<AuthUser | null>({
    email: 'einsatz@example.test',
    rolle: 'mitarbeiter',
    mitarbeiterId: 3,
  });
  readonly sessionResetVersion = signal(0);

  login = vi.fn(() =>
    of({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      email: 'einsatz@example.test',
      rolle: 'mitarbeiter',
      mitarbeiterId: 3,
    }),
  );
  logout = vi.fn(async () => undefined);
}

class MockObjectContext {
  readonly objects = signal<ObjectListItem[]>([
    {
      id: 7,
      name: 'Objekt A',
      street: 'Hauptstrasse',
      houseNumber: '1',
      postalCode: '10115',
      city: 'Berlin',
      status: 'AKTIV',
      customerName: 'Kunde A',
    },
    {
      id: 8,
      name: 'Objekt B',
      street: 'Nebenstrasse',
      houseNumber: null,
      postalCode: '20202',
      city: 'Hamburg',
      status: 'INAKTIV',
      customerName: 'Kunde B',
    },
  ]);
  readonly objectsLoading = signal(false);
  readonly objectsError = signal<string | null>(null);
  readonly selectedObjectId = signal<number | null>(7);
  readonly selectedObject = computed(
    () => this.objects().find((object) => object.id === this.selectedObjectId()) ?? null,
  );
  readonly activeObjects = computed(() =>
    this.objects().filter((object) => (object.status ?? 'AKTIV') !== 'INAKTIV'),
  );

  ensureObjectsLoaded = vi.fn();
  reloadObjects = vi.fn();

  setSelectedObjectId(objectId: number | null): void {
    this.selectedObjectId.set(objectId);
  }
}

class MockTimerState {
  readonly activeTimer = signal<ActiveStamp | null>(null);
  readonly runtime = signal('00:00:00');
  readonly isActive = computed(() => this.activeTimer() != null);

  setActive(stamp: ActiveStamp): void {
    this.activeTimer.set(stamp);
  }

  clearActive(): void {
    this.activeTimer.set(null);
  }
}

const evidenceItem: EvidenceListItem = {
  id: 99,
  objectId: 7,
  employeeId: 3,
  filename: 'foto.jpg',
  mimeType: 'image/jpeg',
  fileSize: 4,
  sha256: 'hash-1',
  note: null,
  createdAt: '2026-05-03T08:00:00.000Z',
  createdByEmail: 'einsatz@example.test',
  createdByName: 'Erika Einsatz',
};

interface PageTestHarness {
  auth: MockAuthService;
  objectContext: MockObjectContext;
  router: MockRouter;
  timerState: MockTimerState;
}

function configurePageTest(providers: unknown[] = []): PageTestHarness {
  const auth = new MockAuthService();
  const objectContext = new MockObjectContext();
  const router = new MockRouter();
  const timerState = new MockTimerState();
  TestBed.configureTestingModule({
    providers: [
      { provide: Router, useValue: router },
      { provide: MobileAuthService, useValue: auth },
      { provide: ObjectContextService, useValue: objectContext },
      { provide: TimerStateService, useValue: timerState },
      ...providers,
    ],
  });
  return { auth, objectContext, router, timerState };
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('mobile page workflows', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('keeps invalid login on the page and shows a field error toast', () => {
    const { auth } = configurePageTest();
    const page = TestBed.runInInjectionContext(() => new LoginPage()) as LoginPage & {
      toastOpen: Signal<boolean>;
      toastMessage: Signal<string>;
    };

    page.login();

    expect(auth.login).not.toHaveBeenCalled();
    expect(page.toastOpen()).toBe(true);
    expect(page.toastMessage()).toBe('Bitte E-Mail und Passwort eingeben.');
    expect(page.form.controls.email.touched).toBe(true);
  });

  it('filters active objects and returns to the requested route after selection', async () => {
    const { objectContext, router } = configurePageTest([
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { queryParamMap: convertToParamMap({ returnUrl: '/tabs/foto' }) },
          queryParamMap: of(convertToParamMap({ returnUrl: '/tabs/foto' })),
        },
      },
    ]);
    const page = TestBed.runInInjectionContext(() => new ObjektAuswahlPage()) as ObjektAuswahlPage & {
      query: { set(value: string): void };
      filteredObjects: Signal<ObjectListItem[]>;
      selectObject(objectId: number): Promise<void>;
    };

    page.query.set('kunde a');
    await page.selectObject(7);

    expect(objectContext.ensureObjectsLoaded).not.toHaveBeenCalled();
    expect(page.filteredObjects().map((object) => object.id)).toEqual([7]);
    expect(objectContext.selectedObjectId()).toBe(7);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tabs/foto');
  });

  it('uploads a captured evidence photo for the selected object', async () => {
    const evidence = { upload: vi.fn(() => of(evidenceItem)) };
    configurePageTest([
      {
        provide: EvidenceService,
        useValue: evidence,
      },
      {
        provide: PhotoCaptureService,
        useValue: {
          captureFromCamera: vi.fn(async () => ({
            dataUrl: 'data:image/jpeg;base64,cGhvdG8=',
            blob: new Blob(['foto'], { type: 'image/jpeg' }),
          })),
        },
      },
    ]);
    const page = TestBed.runInInjectionContext(() => new FotoUploadPage()) as FotoUploadPage & {
      note: { set(value: string): void };
      takePhoto(): Promise<void>;
      upload(): void;
      previewDataUrl: Signal<string | null>;
      previewBlob: Signal<Blob | null>;
      toastMessage: Signal<string>;
    };

    await page.takePhoto();
    page.note.set('Eingang dokumentiert');
    page.upload();

    expect(page.previewDataUrl()).toBeNull();
    expect(page.previewBlob()).toBeNull();
    expect(evidence.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        objectId: 7,
        note: 'Eingang dokumentiert',
        photo: expect.any(Blob),
      }),
    );
    expect(page.toastMessage()).toBe('Nachweis erfolgreich hochgeladen!');
  });

  it('keeps a captured photo available when evidence upload fails', async () => {
    const evidence = {
      upload: vi.fn(() =>
        throwError(() => ({
          error: { message: 'Datei ist zu groß.' },
        })),
      ),
    };
    configurePageTest([
      { provide: EvidenceService, useValue: evidence },
      {
        provide: PhotoCaptureService,
        useValue: {
          captureFromCamera: vi.fn(async () => ({
            dataUrl: 'data:image/jpeg;base64,cGhvdG8=',
            blob: new Blob(['foto'], { type: 'image/jpeg' }),
          })),
        },
      },
    ]);
    const page = TestBed.runInInjectionContext(() => new FotoUploadPage()) as FotoUploadPage & {
      takePhoto(): Promise<void>;
      upload(): void;
      previewDataUrl: Signal<string | null>;
      previewBlob: Signal<Blob | null>;
      uploadFailed: Signal<boolean>;
      toastMessage: Signal<string>;
    };

    await page.takePhoto();
    page.upload();

    expect(page.previewDataUrl()).toBe('data:image/jpeg;base64,cGhvdG8=');
    expect(page.previewBlob()).toBeInstanceOf(Blob);
    expect(page.uploadFailed()).toBe(true);
    expect(page.toastMessage()).toBe('Datei ist zu groß.');
  });

  it('submits checklist answers only after required fields are complete', async () => {
    const template: ChecklistTemplate = {
      id: 5,
      name: 'Treppenhaus',
      description: null,
      version: 1,
      isActive: true,
      fields: [
        { fieldId: 'ok', label: 'Erledigt', type: 'boolean', required: true },
        { fieldId: 'note', label: 'Notiz', type: 'text', required: true },
      ],
    };
    const checklist = {
      getTemplatesForObject: vi.fn(() => of([template])),
      submitChecklist: vi.fn(() => of({ id: 41 })),
    };
    configurePageTest([
      {
        provide: ChecklistService,
        useValue: checklist,
      },
      { provide: EvidenceService, useValue: { upload: vi.fn(() => of(evidenceItem)) } },
      { provide: PhotoCaptureService, useValue: { captureWithPrompt: vi.fn() } },
    ]);
    const page = TestBed.runInInjectionContext(() => new ChecklistenPage()) as ChecklistenPage & {
      setTextAnswer(fieldId: string, value: string): void;
      setBooleanAnswer(fieldId: string, value: boolean): void;
      submit(): void;
      canSubmit: Signal<boolean>;
      note: { set(value: string): void };
      toastMessage: Signal<string>;
    };

    page.ngOnInit();
    page.ionViewWillEnter();
    await settle();
    expect(page.canSubmit()).toBe(false);

    page.setBooleanAnswer('ok', true);
    page.setTextAnswer('note', ' sauber ');
    page.note.set('Kontrolle vor Ort');
    expect(page.canSubmit()).toBe(true);

    page.submit();

    expect(checklist.submitChecklist).toHaveBeenCalledWith({
      objectId: 7,
      templateId: 5,
      note: 'Kontrolle vor Ort',
      answers: [
        { fieldId: 'ok', value: true },
        { fieldId: 'note', value: ' sauber ' },
      ],
    } satisfies CreateChecklistSubmissionRequest);
    expect(page.toastMessage()).toBe('Checkliste gespeichert.');
  });

  it('shows checklist load errors without leaving stale templates selected', async () => {
    const checklist = {
      getTemplatesForObject: vi.fn(() => throwError(() => new Error('network'))),
      submitChecklist: vi.fn(),
    };
    configurePageTest([
      { provide: ChecklistService, useValue: checklist },
      { provide: EvidenceService, useValue: { upload: vi.fn(() => of(evidenceItem)) } },
      { provide: PhotoCaptureService, useValue: { captureWithPrompt: vi.fn() } },
    ]);
    const page = TestBed.runInInjectionContext(() => new ChecklistenPage()) as ChecklistenPage & {
      templates: Signal<ChecklistTemplate[]>;
      selectedTemplate: Signal<ChecklistTemplate | null>;
      templatesLoading: Signal<boolean>;
      errorMessage: Signal<string | null>;
    };

    page.ngOnInit();
    page.ionViewWillEnter();
    await settle();

    expect(page.templates()).toEqual([]);
    expect(page.selectedTemplate()).toBeNull();
    expect(page.templatesLoading()).toBe(false);
    expect(page.errorMessage()).toBe('Checklisten konnten nicht geladen werden.');
  });

  it('marks a waste pickup done and removes it from upcoming pickups', () => {
    const pickup: WastePickup = {
      id: 12,
      objectId: 7,
      wasteType: 'Papier',
      color: '#2563eb',
      pickupDate: '2026-05-04',
      isDone: false,
      isToday: false,
      isDue: true,
    };
    const updated: WastePickup = { ...pickup, isDone: true, isDue: false };
    const wastePlan = {
      getUpcoming: vi.fn(() => of([])),
      getPickupsForObject: vi.fn(() => of([pickup])),
      markPickupDone: vi.fn(() => of(updated)),
    };
    configurePageTest([
      {
        provide: WastePlanService,
        useValue: wastePlan,
      },
    ]);
    const page = TestBed.runInInjectionContext(() => new MuellplanPage()) as MuellplanPage & {
      objectPickups: { set(value: WastePickup[]): void } & Signal<WastePickup[]>;
      upcomingPickups: { set(value: UpcomingWastePickup[]): void } & Signal<UpcomingWastePickup[]>;
      markDone(pickup: WastePickup): void;
      toastMessage: Signal<string>;
    };

    page.objectPickups.set([pickup]);
    page.upcomingPickups.set([{ ...pickup, objectName: 'Objekt A' }]);
    page.markDone(pickup);

    expect(wastePlan.markPickupDone).toHaveBeenCalledWith(12);
    expect(page.objectPickups()).toEqual([updated]);
    expect(page.upcomingPickups()).toEqual([]);
    expect(page.toastMessage()).toBe('Abgehakt!');
  });

  it('starts the time clock against the selected object and stores the active timer', () => {
    const started: StampEntry = {
      id: 21,
      employeeId: 3,
      objectId: 7,
      start: '2026-05-03T08:00:00.000Z',
      stop: null,
      durationMinutes: null,
      note: 'Start',
    };
    const stampService = {
      getActiveStamp: vi.fn(() => throwError(() => new Error('skip initial restore'))),
      start: vi.fn(() => of(started)),
      stop: vi.fn(),
    };
    const { timerState } = configurePageTest([
      {
        provide: StempelService,
        useValue: stampService,
      },
    ]);
    const page = TestBed.runInInjectionContext(() => new StempeluhrPage()) as StempeluhrPage & {
      updateNote(value: string): void;
      statusMessage: Signal<string>;
    };

    page.updateNote(' Start ');
    page.start();

    expect(stampService.start).toHaveBeenCalledWith(3, 7, 'Start');
    expect(timerState.activeTimer()).toEqual({
      id: 21,
      start: new Date('2026-05-03T08:00:00.000Z'),
    });
    expect(page.statusMessage()).toBe('Stempel gestartet: Objekt A.');
  });
});
