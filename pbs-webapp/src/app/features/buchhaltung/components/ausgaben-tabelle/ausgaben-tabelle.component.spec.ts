import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { AusgabenTabelleComponent } from './ausgaben-tabelle.component';

describe('AusgabenTabelleComponent', () => {
  let component: AusgabenTabelleComponent;
  let fixture: ComponentFixture<AusgabenTabelleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AusgabenTabelleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AusgabenTabelleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('rows', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
