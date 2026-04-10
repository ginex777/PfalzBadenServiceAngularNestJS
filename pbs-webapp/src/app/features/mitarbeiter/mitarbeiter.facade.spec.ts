import { TestBed } from '@angular/core/testing';
import { MitarbeiterFacade } from './mitarbeiter.facade';

describe('MitarbeiterFacade', () => {
  let service: MitarbeiterFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MitarbeiterFacade]
    });

    service = TestBed.inject(MitarbeiterFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
