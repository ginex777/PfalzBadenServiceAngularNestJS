import { TestBed } from '@angular/core/testing';
import { EuerService } from './euer.service';

describe('EuerService', () => {
  let service: EuerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EuerService],
    });

    service = TestBed.inject(EuerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
