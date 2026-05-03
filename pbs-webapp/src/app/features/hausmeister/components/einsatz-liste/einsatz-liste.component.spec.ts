import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { EinsatzListeComponent } from './einsatz-liste.component';

describe('EinsatzListeComponent', () => {
  let component: EinsatzListeComponent;
  let fixture: ComponentFixture<EinsatzListeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EinsatzListeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EinsatzListeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('einsaetze', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
