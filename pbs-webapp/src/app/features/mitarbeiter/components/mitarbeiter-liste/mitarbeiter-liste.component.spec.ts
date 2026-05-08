import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { MitarbeiterListeComponent } from './mitarbeiter-liste.component';

describe('MitarbeiterListeComponent', () => {
  let component: MitarbeiterListeComponent;
  let fixture: ComponentFixture<MitarbeiterListeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MitarbeiterListeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MitarbeiterListeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('employees', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
