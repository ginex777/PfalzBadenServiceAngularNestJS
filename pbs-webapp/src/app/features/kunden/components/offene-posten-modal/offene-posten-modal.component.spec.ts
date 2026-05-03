import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { OffenePostenModalComponent } from './offene-posten-modal.component';

describe('OffenePostenModalComponent', () => {
  let component: OffenePostenModalComponent;
  let fixture: ComponentFixture<OffenePostenModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OffenePostenModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OffenePostenModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('daten', {
      kundeId: 1,
      kundeName: 'Test',
      offenSaldo: 0,
      offeneAnzahl: 0,
      umsatzBezahlt: 0,
      ueberfaelligeAnzahl: 0,
      ueberfaelligeSumme: 0,
      rechnungen: [],
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
