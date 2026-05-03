import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { TerminKalenderComponent } from './termin-kalender.component';

describe('TerminKalenderComponent', () => {
  let component: TerminKalenderComponent;
  let fixture: ComponentFixture<TerminKalenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerminKalenderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TerminKalenderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('object', {
      id: 1,
      name: 'Testobjekt',
    });
    fixture.componentRef.setInput('terms', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
