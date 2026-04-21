import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ObjektListeComponent } from './objekt-liste.component';

describe('ObjektListeComponent', () => {
  let component: ObjektListeComponent;
  let fixture: ComponentFixture<ObjektListeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ObjektListeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ObjektListeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
