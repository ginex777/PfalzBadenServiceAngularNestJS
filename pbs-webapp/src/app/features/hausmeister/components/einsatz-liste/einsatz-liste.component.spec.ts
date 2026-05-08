import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { EinsatzListeComponent } from './einsatz-liste.component';
import type { HausmeisterEinsatz } from '../../../../core/models';

const assignment: HausmeisterEinsatz = {
  id: 1,
  mitarbeiter_name: 'Max Mustermann',
  kunden_name: 'Objekt A',
  datum: '2026-05-08',
  taetigkeiten: [{ beschreibung: 'Reinigung', stunden: 1 }],
  stunden_gesamt: 1,
  abgeschlossen: false,
};

describe('EinsatzListeComponent', () => {
  let component: EinsatzListeComponent;
  let fixture: ComponentFixture<EinsatzListeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EinsatzListeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EinsatzListeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('assignments', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits explicit row action request events', () => {
    const editSpy = vi.fn();
    const deleteSpy = vi.fn();
    component.editRequested.subscribe(editSpy);
    component.deleteRequested.subscribe(deleteSpy);

    component.editRequested.emit(assignment);
    component.deleteRequested.emit(assignment.id);

    expect(editSpy).toHaveBeenCalledWith(assignment);
    expect(deleteSpy).toHaveBeenCalledWith(assignment.id);
  });
});
