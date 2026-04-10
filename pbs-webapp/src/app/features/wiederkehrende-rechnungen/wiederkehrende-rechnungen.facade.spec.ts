import { TestBed } from '@angular/core/testing';
import { WiederkehrendeRechnungenFacade } from './wiederkehrende-rechnungen.facade';

describe('WiederkehrendeRechnungenFacade', () => {
  let service: WiederkehrendeRechnungenFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WiederkehrendeRechnungenFacade]
    });

    service = TestBed.inject(WiederkehrendeRechnungenFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
