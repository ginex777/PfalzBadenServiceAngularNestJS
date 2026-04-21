import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StundenErfassungComponent } from './stunden-erfassung.component';

describe('StundenErfassungComponent', () => {
  let component: StundenErfassungComponent;
  let fixture: ComponentFixture<StundenErfassungComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StundenErfassungComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StundenErfassungComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
