import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RechnungenFormularComponent } from './rechnungen-formular.component';

describe('RechnungenFormularComponent', () => {
  let component: RechnungenFormularComponent;
  let fixture: ComponentFixture<RechnungenFormularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RechnungenFormularComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RechnungenFormularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
