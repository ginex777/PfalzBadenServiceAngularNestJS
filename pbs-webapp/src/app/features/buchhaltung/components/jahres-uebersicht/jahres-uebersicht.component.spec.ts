import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JahresUebersichtComponent } from './jahres-uebersicht.component';

describe('JahresUebersichtComponent', () => {
  let component: JahresUebersichtComponent;
  let fixture: ComponentFixture<JahresUebersichtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [JahresUebersichtComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JahresUebersichtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
