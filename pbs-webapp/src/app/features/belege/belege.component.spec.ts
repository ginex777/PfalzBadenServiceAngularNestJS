import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Beleg } from '../../core/models';
import { BelegeFacade } from './belege.facade';
import { BelegeComponent } from './belege.component';

interface BelegeFacadeMock {
  laedt: ReturnType<typeof signal<boolean>>;
  belege: ReturnType<typeof signal<Beleg[]>>;
  suchbegriff: ReturnType<typeof signal<string>>;
  aktiverFilter: ReturnType<typeof signal<'alle'>>;
  jahrFilter: ReturnType<typeof signal<number | null>>;
  verfuegbareJahre: ReturnType<typeof signal<number[]>>;
  gefilterteBelege: ReturnType<typeof signal<Beleg[]>>;
  seitenBelege: ReturnType<typeof signal<Beleg[]>>;
  gesamtSeiten: ReturnType<typeof signal<number>>;
  aktuelleSeite: ReturnType<typeof signal<number>>;
  gesamtGroesse: ReturnType<typeof signal<string>>;
  spaetesteAufbewahrung: ReturnType<typeof signal<string>>;
  notizBearbeitungId: ReturnType<typeof signal<number | null>>;
  viewerBeleg: ReturnType<typeof signal<Beleg | null>>;
  loeschKandidat: ReturnType<typeof signal<number | null>>;
  ladeDaten: ReturnType<typeof vi.fn>;
  viewerOeffnen: ReturnType<typeof vi.fn>;
  viewerSchliessen: ReturnType<typeof vi.fn>;
  notizBearbeitungStarten: ReturnType<typeof vi.fn>;
  notizBearbeitungAbbrechen: ReturnType<typeof vi.fn>;
  notizSpeichern: ReturnType<typeof vi.fn>;
  loeschenBestaetigen: ReturnType<typeof vi.fn>;
  loeschenAusfuehren: ReturnType<typeof vi.fn>;
  loeschenAbbrechen: ReturnType<typeof vi.fn>;
  downloadUrl: ReturnType<typeof vi.fn>;
  dateigroesseFormatieren: ReturnType<typeof vi.fn>;
  istBild: ReturnType<typeof vi.fn>;
  seiteZurueck: ReturnType<typeof vi.fn>;
  seiteVor: ReturnType<typeof vi.fn>;
  filterSetzen: ReturnType<typeof vi.fn>;
  jahrFilterSetzen: ReturnType<typeof vi.fn>;
  suchbegriffAktualisieren: ReturnType<typeof vi.fn>;
}

const receipt: Beleg = {
  id: 7,
  filename: 'rechnung.pdf',
  mimetype: 'application/pdf',
  filesize: 1280,
  sha256: 'abc',
  typ: 'rechnung',
  notiz: 'Initiale Notiz',
  erstellt_am: '2026-05-01T10:00:00.000Z',
  aufbewahrung_bis: '2036-05-01T10:00:00.000Z',
};

function createFacadeMock(): BelegeFacadeMock {
  const receipts = signal<Beleg[]>([receipt]);

  return {
    laedt: signal(false),
    belege: receipts,
    suchbegriff: signal(''),
    aktiverFilter: signal('alle'),
    jahrFilter: signal<number | null>(null),
    verfuegbareJahre: signal([2026]),
    gefilterteBelege: receipts,
    seitenBelege: receipts,
    gesamtSeiten: signal(1),
    aktuelleSeite: signal(1),
    gesamtGroesse: signal('0.0 MB'),
    spaetesteAufbewahrung: signal('01.05.2036'),
    notizBearbeitungId: signal<number | null>(null),
    viewerBeleg: signal<Beleg | null>(null),
    loeschKandidat: signal<number | null>(null),
    ladeDaten: vi.fn(),
    viewerOeffnen: vi.fn(),
    viewerSchliessen: vi.fn(),
    notizBearbeitungStarten: vi.fn(),
    notizBearbeitungAbbrechen: vi.fn(),
    notizSpeichern: vi.fn(),
    loeschenBestaetigen: vi.fn(),
    loeschenAusfuehren: vi.fn(),
    loeschenAbbrechen: vi.fn(),
    downloadUrl: vi.fn((id: number) => `/api/belege/${id}/download`),
    dateigroesseFormatieren: vi.fn(() => '1.3 KB'),
    istBild: vi.fn(() => false),
    seiteZurueck: vi.fn(),
    seiteVor: vi.fn(),
    filterSetzen: vi.fn(),
    jahrFilterSetzen: vi.fn(),
    suchbegriffAktualisieren: vi.fn(),
  };
}

describe('BelegeComponent', () => {
  let fixture: ComponentFixture<BelegeComponent>;
  let facade: BelegeFacadeMock;

  beforeEach(async () => {
    facade = createFacadeMock();

    await TestBed.configureTestingModule({
      imports: [BelegeComponent],
      providers: [{ provide: BelegeFacade, useValue: facade }],
    }).compileComponents();

    fixture = TestBed.createComponent(BelegeComponent);
    fixture.detectChanges();
  });

  it('opens the viewer from a native filename button', () => {
    const filenameButton = fixture.nativeElement.querySelector(
      '.td-datei button[type="button"]',
    ) as HTMLButtonElement | null;

    expect(filenameButton).not.toBeNull();
    filenameButton?.click();

    expect(facade.viewerOeffnen).toHaveBeenCalledWith(receipt);
  });

  it('starts and cancels note editing through native buttons', () => {
    const noteButton = fixture.nativeElement.querySelector(
      '.notiz-button[type="button"]',
    ) as HTMLButtonElement | null;

    expect(noteButton).not.toBeNull();
    noteButton?.click();
    expect(facade.notizBearbeitungStarten).toHaveBeenCalledWith(receipt.id);

    facade.notizBearbeitungId.set(receipt.id);
    fixture.detectChanges();

    const cancelButton = fixture.nativeElement.querySelector(
      'button[aria-label="Notizbearbeitung abbrechen"]',
    ) as HTMLButtonElement | null;

    expect(cancelButton?.type).toBe('button');
    cancelButton?.click();
    expect(facade.notizBearbeitungAbbrechen).toHaveBeenCalled();
  });

  it('closes the viewer on Escape through the modal keyboard handler', () => {
    facade.viewerBeleg.set(receipt);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(facade.viewerSchliessen).toHaveBeenCalled();
  });
});
