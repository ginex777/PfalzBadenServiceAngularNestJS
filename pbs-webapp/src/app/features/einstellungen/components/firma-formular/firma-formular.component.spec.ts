import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { FirmaFormularComponent } from './firma-formular.component';

describe('FirmaFormularComponent', () => {
  let component: FirmaFormularComponent;
  let fixture: ComponentFixture<FirmaFormularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirmaFormularComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FirmaFormularComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('firma', {
      name: '',
      strasse: '',
      ort: '',
      email: '',
      telefon: '',
      steuernummer: '',
      ustId: '',
      bank: '',
      iban: '',
      bic: '',
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
