import { TestBed } from '@angular/core/testing';
import { RechnungenFacade } from './rechnungen.facade';

describe('RechnungenFacade', () => {
  let service: RechnungenFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RechnungenFacade]
    });

    service = TestBed.inject(RechnungenFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
