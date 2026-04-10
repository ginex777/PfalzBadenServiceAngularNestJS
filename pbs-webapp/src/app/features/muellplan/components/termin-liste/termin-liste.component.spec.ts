import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TerminListeComponent } from './termin-liste.component';

describe('TerminListeComponent', () => {
  let component: TerminListeComponent;
  let fixture: ComponentFixture<TerminListeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TerminListeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TerminListeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
