import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { WiederkehrendeAusgabe } from '../../core/models';
import { WiederkehrendeAusgabenComponent } from './wiederkehrende-ausgaben.component';
import { WiederkehrendeAusgabenFacade } from './wiederkehrende-ausgaben.facade';
import type { WiederkehrendeAusgabeFormularDaten } from './wiederkehrende-ausgaben.models';
import { LEERES_FORMULAR } from './wiederkehrende-ausgaben.models';

interface WiederkehrendeAusgabenFacadeMock {
  ausgaben: ReturnType<typeof signal<WiederkehrendeAusgabe[]>>;
  gefilterteAusgaben: ReturnType<typeof signal<WiederkehrendeAusgabe[]>>;
  aktiveSumme: ReturnType<typeof signal<{ netto: number; vst: number; brutto: number }>>;
  formularSichtbar: ReturnType<typeof signal<boolean>>;
  bearbeiteteAusgabe: ReturnType<typeof signal<WiederkehrendeAusgabe | null>>;
  loeschKandidat: ReturnType<typeof signal<number | null>>;
  suchbegriff: ReturnType<typeof signal<string>>;
  formularDaten: ReturnType<typeof signal<WiederkehrendeAusgabeFormularDaten>>;
  ladeDaten: ReturnType<typeof vi.fn>;
  formularOeffnen: ReturnType<typeof vi.fn>;
  formularSchliessen: ReturnType<typeof vi.fn>;
  speichern: ReturnType<typeof vi.fn>;
  kategorieGeaendert: ReturnType<typeof vi.fn>;
  aktivToggle: ReturnType<typeof vi.fn>;
  loeschenBestaetigen: ReturnType<typeof vi.fn>;
  loeschenAusfuehren: ReturnType<typeof vi.fn>;
  loeschenAbbrechen: ReturnType<typeof vi.fn>;
}

const recurringExpense: WiederkehrendeAusgabe = {
  id: 1,
  name: 'Software',
  kategorie: 'Betriebsausgabe',
  brutto: 119,
  mwst: 19,
  abzug: 100,
  aktiv: true,
};

function createFacadeMock(): WiederkehrendeAusgabenFacadeMock {
  const expenses = signal<WiederkehrendeAusgabe[]>([recurringExpense]);

  return {
    ausgaben: expenses,
    gefilterteAusgaben: expenses,
    aktiveSumme: signal({ netto: 100, vst: 19, brutto: 119 }),
    formularSichtbar: signal(false),
    bearbeiteteAusgabe: signal<WiederkehrendeAusgabe | null>(null),
    loeschKandidat: signal<number | null>(null),
    suchbegriff: signal(''),
    formularDaten: signal<WiederkehrendeAusgabeFormularDaten>({ ...LEERES_FORMULAR }),
    ladeDaten: vi.fn(),
    formularOeffnen: vi.fn(),
    formularSchliessen: vi.fn(),
    speichern: vi.fn(),
    kategorieGeaendert: vi.fn(),
    aktivToggle: vi.fn(),
    loeschenBestaetigen: vi.fn(),
    loeschenAusfuehren: vi.fn(),
    loeschenAbbrechen: vi.fn(),
  };
}

describe('WiederkehrendeAusgabenComponent', () => {
  let fixture: ComponentFixture<WiederkehrendeAusgabenComponent>;
  let facade: WiederkehrendeAusgabenFacadeMock;

  beforeEach(async () => {
    facade = createFacadeMock();

    await TestBed.configureTestingModule({
      imports: [WiederkehrendeAusgabenComponent],
      providers: [{ provide: WiederkehrendeAusgabenFacade, useValue: facade }],
    }).compileComponents();

    fixture = TestBed.createComponent(WiederkehrendeAusgabenComponent);
    fixture.detectChanges();
  });

  it('labels recurring expense net and tax calculations as UI preview only', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Aktive Fixkosten (UI-Vorschau)');
    expect(text).toContain('Netto (UI-Vorschau)');
    expect(text).toContain('Vorsteuer (UI-Vorschau)');
  });

});
