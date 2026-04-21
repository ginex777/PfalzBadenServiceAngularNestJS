import { TestBed } from '@angular/core/testing';
import { EinstellungenFacade } from './einstellungen.facade';

describe('EinstellungenFacade', () => {
  let service: EinstellungenFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EinstellungenFacade],
    });

    service = TestBed.inject(EinstellungenFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
