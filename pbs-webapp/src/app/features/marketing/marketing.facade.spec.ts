import { TestBed } from '@angular/core/testing';
import { MarketingFacade } from './marketing.facade';

describe('MarketingFacade', () => {
  let service: MarketingFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MarketingFacade]
    });

    service = TestBed.inject(MarketingFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
