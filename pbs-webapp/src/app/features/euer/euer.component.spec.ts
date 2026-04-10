import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EuerComponent } from './euer.component';

describe('EuerComponent', () => {
  let component: EuerComponent;
  let fixture: ComponentFixture<EuerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EuerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EuerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
