import { TestBed } from '@angular/core/testing';
import { SucheFacade } from './suche.facade';

describe('SucheFacade', () => {
  let service: SucheFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SucheFacade],
    });

    service = TestBed.inject(SucheFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
