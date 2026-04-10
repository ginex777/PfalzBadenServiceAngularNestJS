import { TestBed } from '@angular/core/testing';
import { HausmeisterFacade } from './hausmeister.facade';

describe('HausmeisterFacade', () => {
  let service: HausmeisterFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HausmeisterFacade]
    });

    service = TestBed.inject(HausmeisterFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
