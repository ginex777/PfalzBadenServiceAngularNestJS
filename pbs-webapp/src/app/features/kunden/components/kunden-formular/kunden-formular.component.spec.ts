import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KundenFormularComponent } from './kunden-formular.component';

describe('KundenFormularComponent', () => {
  let component: KundenFormularComponent;
  let fixture: ComponentFixture<KundenFormularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KundenFormularComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KundenFormularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
