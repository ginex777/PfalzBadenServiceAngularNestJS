import { TestBed } from '@angular/core/testing';
import { KundenFacade } from './kunden.facade';

describe('KundenFacade', () => {
  let service: KundenFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KundenFacade]
    });

    service = TestBed.inject(KundenFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
