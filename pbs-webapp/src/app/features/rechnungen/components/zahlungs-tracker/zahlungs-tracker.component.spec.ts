import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZahlungsTrackerComponent } from './zahlungs-tracker.component';

describe('ZahlungsTrackerComponent', () => {
  let component: ZahlungsTrackerComponent;
  let fixture: ComponentFixture<ZahlungsTrackerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ZahlungsTrackerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ZahlungsTrackerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
