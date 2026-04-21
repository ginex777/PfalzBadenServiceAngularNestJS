import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WiederkehrendeRechnungenComponent } from './wiederkehrende-rechnungen.component';

describe('WiederkehrendeRechnungenComponent', () => {
  let component: WiederkehrendeRechnungenComponent;
  let fixture: ComponentFixture<WiederkehrendeRechnungenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WiederkehrendeRechnungenComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WiederkehrendeRechnungenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
