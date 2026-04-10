import { TestBed } from '@angular/core/testing';
import { MitarbeiterService } from './mitarbeiter.service';

describe('MitarbeiterService', () => {
  let service: MitarbeiterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MitarbeiterService]
    });

    service = TestBed.inject(MitarbeiterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
