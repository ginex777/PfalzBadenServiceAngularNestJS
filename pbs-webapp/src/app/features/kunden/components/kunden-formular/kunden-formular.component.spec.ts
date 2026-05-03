import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { KundenFormularComponent } from './kunden-formular.component';

describe('KundenFormularComponent', () => {
  let component: KundenFormularComponent;
  let fixture: ComponentFixture<KundenFormularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KundenFormularComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KundenFormularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
