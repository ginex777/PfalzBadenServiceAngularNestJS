import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FirmaFormularComponent } from './firma-formular.component';

describe('FirmaFormularComponent', () => {
  let component: FirmaFormularComponent;
  let fixture: ComponentFixture<FirmaFormularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FirmaFormularComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FirmaFormularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
