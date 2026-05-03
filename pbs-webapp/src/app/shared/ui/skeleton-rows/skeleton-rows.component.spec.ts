import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { SkeletonRowsComponent } from './skeleton-rows.component';

describe('SkeletonRowsComponent', () => {
  let component: SkeletonRowsComponent;
  let fixture: ComponentFixture<SkeletonRowsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonRowsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonRowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
