import { TestBed } from '@angular/core/testing';
import { PdfArchivService } from './pdf-archiv.service';

describe('PdfArchivService', () => {
  let service: PdfArchivService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PdfArchivService],
    });

    service = TestBed.inject(PdfArchivService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
