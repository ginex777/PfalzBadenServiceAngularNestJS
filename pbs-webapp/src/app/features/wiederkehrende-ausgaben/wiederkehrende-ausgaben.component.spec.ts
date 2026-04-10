import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WiederkehrendeAusgabenComponent } from './wiederkehrende-ausgaben.component';

describe('WiederkehrendeAusgabenComponent', () => {
  let component: WiederkehrendeAusgabenComponent;
  let fixture: ComponentFixture<WiederkehrendeAusgabenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WiederkehrendeAusgabenComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(WiederkehrendeAusgabenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
