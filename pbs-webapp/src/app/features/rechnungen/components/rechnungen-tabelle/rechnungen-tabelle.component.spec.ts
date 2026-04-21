import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RechnungenTabelleComponent } from './rechnungen-tabelle.component';

describe('RechnungenTabelleComponent', () => {
  let component: RechnungenTabelleComponent;
  let fixture: ComponentFixture<RechnungenTabelleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RechnungenTabelleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RechnungenTabelleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
