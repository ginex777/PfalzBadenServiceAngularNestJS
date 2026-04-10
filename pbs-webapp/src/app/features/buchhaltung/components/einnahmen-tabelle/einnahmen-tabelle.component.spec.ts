import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EinnahmenTabelleComponent } from './einnahmen-tabelle.component';

describe('EinnahmenTabelleComponent', () => {
  let component: EinnahmenTabelleComponent;
  let fixture: ComponentFixture<EinnahmenTabelleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EinnahmenTabelleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EinnahmenTabelleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
