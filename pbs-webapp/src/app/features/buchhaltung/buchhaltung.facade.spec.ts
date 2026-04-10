import { TestBed } from '@angular/core/testing';
import { BuchhaltungFacade } from './buchhaltung.facade';

describe('BuchhaltungFacade', () => {
  let service: BuchhaltungFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BuchhaltungFacade]
    });

    service = TestBed.inject(BuchhaltungFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
