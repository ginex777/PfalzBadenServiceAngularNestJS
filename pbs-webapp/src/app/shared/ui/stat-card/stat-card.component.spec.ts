import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  let component: StatCardComponent;
  let fixture: ComponentFixture<StatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Offene Rechnungen');
    fixture.componentRef.setInput('value', '0');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
