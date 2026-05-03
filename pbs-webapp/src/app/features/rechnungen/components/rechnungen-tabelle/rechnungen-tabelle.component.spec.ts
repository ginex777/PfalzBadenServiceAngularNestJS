import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { RechnungenTabelleComponent } from './rechnungen-tabelle.component';

describe('RechnungenTabelleComponent', () => {
  let component: RechnungenTabelleComponent;
  let fixture: ComponentFixture<RechnungenTabelleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RechnungenTabelleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RechnungenTabelleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('rechnungen', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
