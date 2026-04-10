import { TestBed } from '@angular/core/testing';
import { HausmeisterService } from './hausmeister.service';

describe('HausmeisterService', () => {
  let service: HausmeisterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HausmeisterService]
    });

    service = TestBed.inject(HausmeisterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
