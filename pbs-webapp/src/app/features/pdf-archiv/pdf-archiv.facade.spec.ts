import { TestBed } from '@angular/core/testing';
import { PdfArchivFacade } from './pdf-archiv.facade';

describe('PdfArchivFacade', () => {
  let service: PdfArchivFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PdfArchivFacade],
    });

    service = TestBed.inject(PdfArchivFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
