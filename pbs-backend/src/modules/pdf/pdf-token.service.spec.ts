import { PdfTokenService } from './pdf-token.service';

describe('PdfTokenService', () => {
  it('creates 128-bit hex tokens', () => {
    const service = new PdfTokenService();

    const result = service.createToken(Buffer.from('pdf'), 'report.pdf');

    expect(result.token).toMatch(/^[a-f0-9]{32}$/);
  });

  it('consumes tokens after the first successful read', () => {
    const service = new PdfTokenService();
    const result = service.createToken(Buffer.from('pdf'), 'report.pdf');

    expect(service.getToken(result.token)).toEqual({
      pdf: Buffer.from('pdf'),
      filename: 'report.pdf',
    });
    expect(service.getToken(result.token)).toBeNull();
  });
});
