import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { BuchhaltungComponent } from './buchhaltung.component';

describe('BuchhaltungComponent', () => {
  let component: BuchhaltungComponent;
  let fixture: ComponentFixture<BuchhaltungComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuchhaltungComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BuchhaltungComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
