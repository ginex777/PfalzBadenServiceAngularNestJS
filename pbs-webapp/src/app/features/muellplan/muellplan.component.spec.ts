import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { MuellplanComponent } from './muellplan.component';

describe('MuellplanComponent', () => {
  let component: MuellplanComponent;
  let fixture: ComponentFixture<MuellplanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MuellplanComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MuellplanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
