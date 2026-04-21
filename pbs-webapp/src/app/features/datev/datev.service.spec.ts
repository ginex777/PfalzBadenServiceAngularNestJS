import { TestBed } from '@angular/core/testing';
import { DatevService } from './datev.service';

describe('DatevService', () => {
  let service: DatevService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DatevService],
    });

    service = TestBed.inject(DatevService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
