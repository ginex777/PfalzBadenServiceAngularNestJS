import { TestBed } from '@angular/core/testing';
import { EinstellungenService } from './einstellungen.service';

describe('EinstellungenService', () => {
  let service: EinstellungenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EinstellungenService],
    });

    service = TestBed.inject(EinstellungenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
