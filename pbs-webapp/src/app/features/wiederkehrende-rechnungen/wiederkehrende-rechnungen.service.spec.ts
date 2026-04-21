import { TestBed } from '@angular/core/testing';
import { WiederkehrendeRechnungenService } from './wiederkehrende-rechnungen.service';

describe('WiederkehrendeRechnungenService', () => {
  let service: WiederkehrendeRechnungenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WiederkehrendeRechnungenService],
    });

    service = TestBed.inject(WiederkehrendeRechnungenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
