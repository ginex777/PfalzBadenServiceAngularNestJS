import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BrowserService } from './browser.service';

describe('BrowserService', () => {
  let service: BrowserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BrowserService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(BrowserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('opens urls with safe rel attributes for blank targets', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);

    service.openUrl('/download.pdf');
    service.openUrl('/same-tab', '_self');

    expect(open).toHaveBeenNthCalledWith(1, '/download.pdf', '_blank', 'noopener,noreferrer');
    expect(open).toHaveBeenNthCalledWith(2, '/same-tab', '_self', '');
  });

  it('copies text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await service.copyToClipboard('PBS');

    expect(writeText).toHaveBeenCalledWith('PBS');
  });

  it('downloads csv content through an object url', () => {
    const click = vi.fn();
    const anchor = document.createElement('a');
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(anchor, 'click').mockImplementation(click);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:csv');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    service.downloadCsv('a;b', 'export.csv');

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchor.href).toBe('blob:csv');
    expect(anchor.download).toBe('export.csv');
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv');
  });

  it('opens protected blobs and falls back to a download when popups are blocked', async () => {
    vi.useFakeTimers();
    const click = vi.fn();
    const anchor = document.createElement('a');
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(anchor, 'click').mockImplementation(click);
    vi.spyOn(window, 'open').mockReturnValue(null);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pdf');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    const promise = service.blobOeffnen('/api/pdf/report.pdf');
    http.expectOne('/api/pdf/report.pdf').flush(new Blob(['pdf']));
    await promise;
    vi.advanceTimersByTime(60_000);

    expect(anchor.download).toBe('report.pdf');
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:pdf');
    vi.useRealTimers();
  });
});
