import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { KanbanFacade } from './kanban.facade';
import { KanbanService } from './kanban.service';
import { API_BASE_URL } from '../../core/tokens';
import { Task } from '../../core/models';

const testTasks: Task[] = [
  { id: 1, titel: 'Task A', status: 'todo',       prioritaet: 'hoch',   position: 0, kategorie: 'Allgemein' } as Task,
  { id: 2, titel: 'Task B', status: 'inprogress',  prioritaet: 'mittel', position: 0, kategorie: 'Allgemein' } as Task,
  { id: 3, titel: 'Task C', status: 'done',        prioritaet: 'niedrig',position: 0, kategorie: 'Support'   } as Task,
  { id: 4, titel: 'Task D', status: 'todo',        prioritaet: 'mittel', position: 1, kategorie: 'Support'   } as Task,
];

const mockService = {
  alleLaden: jest.fn(),
  erstellen: jest.fn(),
  aktualisieren: jest.fn(),
  loeschen: jest.fn(),
};

describe('KanbanFacade', () => {
  let facade: KanbanFacade;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService.alleLaden.mockReturnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        KanbanFacade,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: KanbanService, useValue: mockService },
      ],
    });
    facade = TestBed.inject(KanbanFacade);
  });

  it('sollte erstellt werden', () => {
    expect(facade).toBeTruthy();
  });

  describe('gefilterteTasksProSpalte()', () => {
    beforeEach(() => facade.tasks.set(testTasks));

    it('gruppiert Tasks nach Status korrekt', () => {
      const spalten = facade.gefilterteTasksProSpalte();
      expect(spalten.todo).toHaveLength(2);
      expect(spalten.inprogress).toHaveLength(1);
      expect(spalten.done).toHaveLength(1);
      expect(spalten.blocked).toHaveLength(0);
    });

    it('sortiert Tasks nach Position innerhalb einer Spalte', () => {
      const spalten = facade.gefilterteTasksProSpalte();
      expect(spalten.todo[0].id).toBe(1); // position 0
      expect(spalten.todo[1].id).toBe(4); // position 1
    });

    it('filtert nach Priorität', () => {
      facade.filterAktualisieren('prioritaet', 'hoch');
      const spalten = facade.gefilterteTasksProSpalte();
      expect(spalten.todo).toHaveLength(1);
      expect(spalten.todo[0].prioritaet).toBe('hoch');
    });

    it('filtert nach Kategorie', () => {
      facade.filterAktualisieren('kategorie', 'Support');
      const spalten = facade.gefilterteTasksProSpalte();
      expect(spalten.todo).toHaveLength(1);
      expect(spalten.done).toHaveLength(1);
      expect(spalten.inprogress).toHaveLength(0);
    });

    it('filtert nach Suchbegriff (case-insensitive)', () => {
      facade.filterAktualisieren('suchbegriff', 'task a');
      const spalten = facade.gefilterteTasksProSpalte();
      expect(spalten.todo).toHaveLength(1);
      expect(spalten.todo[0].titel).toBe('Task A');
    });

    it('zeigt alle Tasks wenn Filter leer', () => {
      facade.filterLeeren();
      const spalten = facade.gefilterteTasksProSpalte();
      expect(spalten.todo.length + spalten.inprogress.length + spalten.done.length + spalten.blocked.length).toBe(4);
    });
  });

  describe('eindeutigeBearbeiter()', () => {
    it('gibt sortierte einzigartige Bearbeiter zurück', () => {
      facade.tasks.set([
        { ...testTasks[0], bearbeiter: 'Dennis' },
        { ...testTasks[1], bearbeiter: 'Anna' },
        { ...testTasks[2], bearbeiter: 'Dennis' },
        { ...testTasks[3], bearbeiter: undefined },
      ] as Task[]);

      const bearbeiter = facade.eindeutigeBearbeiter();
      expect(bearbeiter).toEqual(['Anna', 'Dennis']);
    });
  });

  describe('drop()', () => {
    it('verschiebt Task in neuen Status und ruft Service auf', () => {
      facade.tasks.set(testTasks);
      mockService.aktualisieren.mockReturnValue(of(testTasks[0]));
      facade.dragTaskId.set(1);

      facade.drop('done');

      const task = facade.tasks().find(t => t.id === 1);
      expect(task?.status).toBe('done');
      expect(mockService.aktualisieren).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'done' }));
    });

    it('tut nichts wenn kein dragTaskId gesetzt', () => {
      facade.dragTaskId.set(null);
      facade.drop('done');
      expect(mockService.aktualisieren).not.toHaveBeenCalled();
    });

    it('tut nichts wenn Status gleich bleibt', () => {
      facade.tasks.set(testTasks);
      facade.dragTaskId.set(1); // Task 1 ist in 'todo'
      facade.drop('todo');
      expect(mockService.aktualisieren).not.toHaveBeenCalled();
    });
  });

  describe('loeschenAusfuehren()', () => {
    it('entfernt Task aus Liste', () => {
      facade.tasks.set(testTasks);
      facade.loeschKandidat.set(2);
      mockService.loeschen.mockReturnValue(of(undefined));

      facade.loeschenAusfuehren();

      expect(facade.tasks()).toHaveLength(3);
      expect(facade.tasks().find(t => t.id === 2)).toBeUndefined();
    });

    it('zeigt Fehler bei Löschen-Fehler', () => {
      facade.tasks.set(testTasks);
      facade.loeschKandidat.set(1);
      mockService.loeschen.mockReturnValue(throwError(() => new Error('Fehler')));

      facade.loeschenAusfuehren();

      expect(facade.fehler()).toBeTruthy();
      expect(facade.tasks()).toHaveLength(4);
    });
  });

  describe('speichern()', () => {
    it('zeigt Fehler wenn Titel fehlt', () => {
      facade.formularDaten.update(d => ({ ...d, titel: '' }));
      facade.speichern();
      expect(facade.fehler()).toBeTruthy();
      expect(mockService.erstellen).not.toHaveBeenCalled();
    });

    it('erstellt neuen Task und fügt ihn hinzu', () => {
      const neuerTask = { ...testTasks[0], id: 99, titel: 'Neuer Task' };
      mockService.erstellen.mockReturnValue(of(neuerTask));
      facade.bearbeiteterTask.set(null);
      facade.formularDaten.update(d => ({ ...d, titel: 'Neuer Task', status: 'todo' }));

      facade.speichern();

      expect(facade.tasks().find(t => t.id === 99)).toBeTruthy();
      expect(facade.formularSichtbar()).toBe(false);
    });
  });

  describe('filterLeeren()', () => {
    it('setzt alle Filter auf leere Strings zurück', () => {
      facade.filterAktualisieren('suchbegriff', 'test');
      facade.filterAktualisieren('kategorie', 'Support');
      facade.filterLeeren();
      const f = facade.filter();
      expect(f.suchbegriff).toBe('');
      expect(f.kategorie).toBe('');
      expect(f.prioritaet).toBe('');
      expect(f.bearbeiter).toBe('');
    });
  });
});
