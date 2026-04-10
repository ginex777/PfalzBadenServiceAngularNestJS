import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketingTabelleComponent } from './marketing-tabelle.component';

describe('MarketingTabelleComponent', () => {
  let component: MarketingTabelleComponent;
  let fixture: ComponentFixture<MarketingTabelleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MarketingTabelleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MarketingTabelleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
