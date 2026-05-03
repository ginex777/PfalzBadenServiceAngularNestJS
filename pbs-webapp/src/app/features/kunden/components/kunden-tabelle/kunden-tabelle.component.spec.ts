import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { KundenTabelleComponent } from './kunden-tabelle.component';
import { sharedTestProviders } from '../../../../testing/shared-test-providers';

describe('KundenTabelleComponent', () => {
  let component: KundenTabelleComponent;
  let fixture: ComponentFixture<KundenTabelleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KundenTabelleComponent],
      providers: sharedTestProviders,
    }).compileComponents();

    fixture = TestBed.createComponent(KundenTabelleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('kunden', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
