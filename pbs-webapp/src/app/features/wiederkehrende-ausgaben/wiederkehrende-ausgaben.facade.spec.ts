import { TestBed } from '@angular/core/testing';
import { WiederkehrendeAusgabenFacade } from './wiederkehrende-ausgaben.facade';

describe('WiederkehrendeAusgabenFacade', () => {
  let service: WiederkehrendeAusgabenFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WiederkehrendeAusgabenFacade],
    });

    service = TestBed.inject(WiederkehrendeAusgabenFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
