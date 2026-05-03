import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { RechnungenComponent } from './rechnungen.component';
import { sharedTestProviders } from '../../testing/shared-test-providers';

describe('RechnungenComponent', () => {
  let component: RechnungenComponent;
  let fixture: ComponentFixture<RechnungenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RechnungenComponent],
      providers: sharedTestProviders,
    }).compileComponents();

    fixture = TestBed.createComponent(RechnungenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
