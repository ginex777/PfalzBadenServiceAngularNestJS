import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonatsErgebnisComponent } from './monats-ergebnis.component';

describe('MonatsErgebnisComponent', () => {
  let component: MonatsErgebnisComponent;
  let fixture: ComponentFixture<MonatsErgebnisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MonatsErgebnisComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonatsErgebnisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
