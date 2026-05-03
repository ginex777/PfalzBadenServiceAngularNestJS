import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { RechnungenFormularComponent } from './rechnungen-formular.component';

describe('RechnungenFormularComponent', () => {
  let component: RechnungenFormularComponent;
  let fixture: ComponentFixture<RechnungenFormularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RechnungenFormularComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RechnungenFormularComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('formularDaten', {
      nr: '',
      empf: '',
      str: '',
      ort: '',
      email: '',
      datum: '',
      leistungsdatum: '',
      zahlungsziel: 14,
      titel: '',
      positionen: [{ bez: '', stunden: '', gesamtpreis: 0 }],
      mwst_satz: 19,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
