import { TestBed } from '@angular/core/testing';
import { WiederkehrendeAusgabenService } from './wiederkehrende-ausgaben.service';

describe('WiederkehrendeAusgabenService', () => {
  let service: WiederkehrendeAusgabenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WiederkehrendeAusgabenService]
    });

    service = TestBed.inject(WiederkehrendeAusgabenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
