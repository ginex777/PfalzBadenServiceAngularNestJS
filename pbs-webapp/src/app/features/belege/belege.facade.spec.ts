import { TestBed } from '@angular/core/testing';
import { BelegeFacade } from './belege.facade';

describe('BelegeFacade', () => {
  let service: BelegeFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BelegeFacade]
    });

    service = TestBed.inject(BelegeFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
