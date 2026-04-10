import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketingFormularComponent } from './marketing-formular.component';

describe('MarketingFormularComponent', () => {
  let component: MarketingFormularComponent;
  let fixture: ComponentFixture<MarketingFormularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MarketingFormularComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MarketingFormularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
