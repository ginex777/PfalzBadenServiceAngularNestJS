import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { MonatsTabsComponent } from './monats-tabs.component';

describe('MonatsTabsComponent', () => {
  let component: MonatsTabsComponent;
  let fixture: ComponentFixture<MonatsTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonatsTabsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonatsTabsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('aktuellerMonat', 0);
    fixture.componentRef.setInput('ansichtsModus', 'monat');
    fixture.componentRef.setInput('gesperrteMonateSet', new Set<number>());
    fixture.componentRef.setInput('monatHatDaten', () => false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
