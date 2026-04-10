import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MitarbeiterListeComponent } from './mitarbeiter-liste.component';

describe('MitarbeiterListeComponent', () => {
  let component: MitarbeiterListeComponent;
  let fixture: ComponentFixture<MitarbeiterListeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MitarbeiterListeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MitarbeiterListeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
