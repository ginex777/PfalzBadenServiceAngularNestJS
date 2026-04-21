import { TestBed } from '@angular/core/testing';
import { SucheService } from './suche.service';

describe('SucheService', () => {
  let service: SucheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SucheService],
    });

    service = TestBed.inject(SucheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
