import { TestBed } from '@angular/core/testing';
import { BelegeService } from './belege.service';

describe('BelegeService', () => {
  let service: BelegeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BelegeService],
    });

    service = TestBed.inject(BelegeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
