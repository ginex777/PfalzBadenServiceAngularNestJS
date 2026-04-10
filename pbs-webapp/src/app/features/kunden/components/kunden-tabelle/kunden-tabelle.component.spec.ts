import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KundenTabelleComponent } from './kunden-tabelle.component';

describe('KundenTabelleComponent', () => {
  let component: KundenTabelleComponent;
  let fixture: ComponentFixture<KundenTabelleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KundenTabelleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(KundenTabelleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
