import { TestBed } from '@angular/core/testing';
import { MuellplanFacade } from './muellplan.facade';

describe('MuellplanFacade', () => {
  let service: MuellplanFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MuellplanFacade],
    });

    service = TestBed.inject(MuellplanFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
