import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EinsatzFormularComponent } from './einsatz-formular.component';

describe('EinsatzFormularComponent', () => {
  let component: EinsatzFormularComponent;
  let fixture: ComponentFixture<EinsatzFormularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EinsatzFormularComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EinsatzFormularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
