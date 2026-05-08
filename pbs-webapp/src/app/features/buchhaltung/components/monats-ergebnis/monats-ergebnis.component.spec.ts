import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { MonatsErgebnisComponent } from './monats-ergebnis.component';

describe('MonatsErgebnisComponent', () => {
  let component: MonatsErgebnisComponent;
  let fixture: ComponentFixture<MonatsErgebnisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonatsErgebnisComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonatsErgebnisComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('monthName', 'Januar');
    fixture.componentRef.setInput('result', {
      einnahmenNetto: 0,
      einnahmenUst: 0,
      ausgabenNetto: 0,
      vorsteuer: 0,
      zahllast: 0,
      gewinn: 0,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
