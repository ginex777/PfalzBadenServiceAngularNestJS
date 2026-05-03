import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { JahresUebersichtComponent } from './jahres-uebersicht.component';

describe('JahresUebersichtComponent', () => {
  let component: JahresUebersichtComponent;
  let fixture: ComponentFixture<JahresUebersichtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JahresUebersichtComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JahresUebersichtComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('jahr', 2026);
    fixture.componentRef.setInput('quartalsDaten', []);
    fixture.componentRef.setInput('jahresMonatsDaten', []);
    fixture.componentRef.setInput('vstQuartale', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
