import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { KundenComponent } from './kunden.component';
import { sharedTestProviders } from '../../testing/shared-test-providers';

describe('KundenComponent', () => {
  let component: KundenComponent;
  let fixture: ComponentFixture<KundenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KundenComponent],
      providers: sharedTestProviders,
    }).compileComponents();

    fixture = TestBed.createComponent(KundenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
