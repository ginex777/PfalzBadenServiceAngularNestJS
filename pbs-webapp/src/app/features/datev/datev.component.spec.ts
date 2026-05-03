import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { DatevComponent } from './datev.component';

describe('DatevComponent', () => {
  let component: DatevComponent;
  let fixture: ComponentFixture<DatevComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatevComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DatevComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
