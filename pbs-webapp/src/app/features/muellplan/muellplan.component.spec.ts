import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MuellplanComponent } from './muellplan.component';

describe('MuellplanComponent', () => {
  let component: MuellplanComponent;
  let fixture: ComponentFixture<MuellplanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MuellplanComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MuellplanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
