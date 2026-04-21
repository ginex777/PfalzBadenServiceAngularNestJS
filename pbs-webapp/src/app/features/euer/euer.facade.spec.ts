import { TestBed } from '@angular/core/testing';
import { EuerFacade } from './euer.facade';

describe('EuerFacade', () => {
  let service: EuerFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EuerFacade],
    });

    service = TestBed.inject(EuerFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
