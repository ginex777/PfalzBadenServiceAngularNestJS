import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { AngeboteFormularComponent } from './angebote-formular.component';
import type { AngebotFormularDaten } from '../../angebote.models';

const formData: AngebotFormularDaten = {
  nr: 'A-1',
  empf: 'Kunde GmbH',
  str: '',
  ort: '',
  email: '',
  datum: '2026-05-08',
  gueltig_bis: '',
  titel: 'Testangebot',
  positionen: [{ bez: 'Reinigung', stunden: '1', gesamtpreis: 100 }],
  mwst_satz: 19,
  zusatz: '',
};

describe('AngeboteFormularComponent', () => {
  let component: AngeboteFormularComponent;
  let fixture: ComponentFixture<AngeboteFormularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngeboteFormularComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AngeboteFormularComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formData', formData);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits explicit save and cancel request events', () => {
    const saveSpy = vi.fn();
    const cancelSpy = vi.fn();
    component.saveRequested.subscribe(saveSpy);
    component.cancelRequested.subscribe(cancelSpy);

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Speichern'))?.click();
    buttons.find((button) => button.textContent?.includes('Zur'))?.click();

    expect(saveSpy).toHaveBeenCalledOnce();
    expect(cancelSpy).toHaveBeenCalledOnce();
  });
});
