import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { EinnahmenTabelleComponent } from './einnahmen-tabelle.component';

describe('EinnahmenTabelleComponent', () => {
  let component: EinnahmenTabelleComponent;
  let fixture: ComponentFixture<EinnahmenTabelleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EinnahmenTabelleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EinnahmenTabelleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('rows', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
