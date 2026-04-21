import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonatsTabsComponent } from './monats-tabs.component';

describe('MonatsTabsComponent', () => {
  let component: MonatsTabsComponent;
  let fixture: ComponentFixture<MonatsTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MonatsTabsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonatsTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
