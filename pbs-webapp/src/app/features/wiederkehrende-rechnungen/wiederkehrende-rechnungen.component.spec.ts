import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { WiederkehrendeRechnungenComponent } from './wiederkehrende-rechnungen.component';

describe('WiederkehrendeRechnungenComponent', () => {
  let component: WiederkehrendeRechnungenComponent;
  let fixture: ComponentFixture<WiederkehrendeRechnungenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WiederkehrendeRechnungenComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WiederkehrendeRechnungenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
