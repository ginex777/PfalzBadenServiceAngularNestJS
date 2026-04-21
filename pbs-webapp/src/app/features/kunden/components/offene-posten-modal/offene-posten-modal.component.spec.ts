import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OffenePostenModalComponent } from './offene-posten-modal.component';

describe('OffenePostenModalComponent', () => {
  let component: OffenePostenModalComponent;
  let fixture: ComponentFixture<OffenePostenModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OffenePostenModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OffenePostenModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
