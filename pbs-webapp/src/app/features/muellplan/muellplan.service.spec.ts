import { TestBed } from '@angular/core/testing';
import { MuellplanService } from './muellplan.service';

describe('MuellplanService', () => {
  let service: MuellplanService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MuellplanService]
    });

    service = TestBed.inject(MuellplanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
