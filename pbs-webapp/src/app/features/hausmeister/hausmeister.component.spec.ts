import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HausmeisterComponent } from './hausmeister.component';

describe('HausmeisterComponent', () => {
  let component: HausmeisterComponent;
  let fixture: ComponentFixture<HausmeisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HausmeisterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HausmeisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
