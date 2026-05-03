import {
  contentDispositionHeader,
  sanitizeDownloadFilename,
} from './content-disposition';

describe('contentDispositionHeader', () => {
  it('strips header-hostile characters from fallback filenames', () => {
    expect(sanitizeDownloadFilename('evil"\r\nname.pdf')).toBe('evil_name.pdf');
  });

  it('adds an ASCII fallback and UTF-8 filename parameter', () => {
    expect(contentDispositionHeader('attachment', 'Müllplan.pdf')).toBe(
      'attachment; filename="Mullplan.pdf"; filename*=UTF-8\'\'M%C3%BCllplan.pdf',
    );
  });

  it('uses a stable fallback for empty filenames', () => {
    expect(contentDispositionHeader('inline', '')).toBe(
      'inline; filename="download"; filename*=UTF-8\'\'download',
    );
  });
});
