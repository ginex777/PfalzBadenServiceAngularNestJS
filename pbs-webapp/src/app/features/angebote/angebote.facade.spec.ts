import { TestBed } from '@angular/core/testing';
import { AngeboteFacade } from './angebote.facade';

describe('AngeboteFacade', () => {
  let service: AngeboteFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AngeboteFacade]
    });

    service = TestBed.inject(AngeboteFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
