import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TerminKalenderComponent } from './termin-kalender.component';

describe('TerminKalenderComponent', () => {
  let component: TerminKalenderComponent;
  let fixture: ComponentFixture<TerminKalenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TerminKalenderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TerminKalenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
