import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { StundenErfassungComponent } from './stunden-erfassung.component';

describe('StundenErfassungComponent', () => {
  let component: StundenErfassungComponent;
  let fixture: ComponentFixture<StundenErfassungComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StundenErfassungComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StundenErfassungComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mitarbeiter', {
      id: 1,
      name: 'Test',
      stundenlohn: 0,
      aktiv: true,
    });
    fixture.componentRef.setInput('stunden', []);
    fixture.componentRef.setInput('formularDaten', {
      datum: '',
      stunden: 0,
      lohnSatz: 0,
      zuschlagProzent: 0,
      ort: '',
      beschreibung: '',
    });
    fixture.componentRef.setInput('statistik', {
      gesamtStunden: 0,
      grundlohn: 0,
      zuschlaege: 0,
      gesamtLohn: 0,
      bezahlt: 0,
      offen: 0,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
