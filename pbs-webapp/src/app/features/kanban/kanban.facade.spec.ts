import { TestBed } from '@angular/core/testing';
import { KanbanFacade } from './kanban.facade';

describe('KanbanFacade', () => {
  let service: KanbanFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KanbanFacade]
    });

    service = TestBed.inject(KanbanFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
