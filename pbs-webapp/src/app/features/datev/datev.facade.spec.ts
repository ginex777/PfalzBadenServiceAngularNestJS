import { TestBed } from '@angular/core/testing';
import { DatevFacade } from './datev.facade';

describe('DatevFacade', () => {
  let service: DatevFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DatevFacade],
    });

    service = TestBed.inject(DatevFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
