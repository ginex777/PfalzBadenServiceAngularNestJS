import { BadRequestException } from '@nestjs/common';
import {
  validatePdfUpload,
  validateReceiptUpload,
  validateWastePlanUpload,
} from './upload-file';

function uploadFile(
  buffer: Buffer,
  mimetype: string,
  originalname = 'receipt.pdf',
  size = buffer.byteLength,
): Express.Multer.File {
  return {
    fieldname: 'beleg',
    originalname,
    encoding: '7bit',
    mimetype,
    size,
    buffer,
    destination: '',
    filename: '',
    path: '',
    stream: undefined as never,
  };
}

describe('validateReceiptUpload', () => {
  it('rejects missing files', () => {
    expect(() => validateReceiptUpload(undefined)).toThrow(BadRequestException);
  });

  it('rejects mismatched MIME and file signature', () => {
    const file = uploadFile(Buffer.from('%PDF-test'), 'image/png');

    expect(() => validateReceiptUpload(file)).toThrow(BadRequestException);
  });

  it('rejects MIME types outside the receipt allowlist', () => {
    const file = uploadFile(Buffer.from('%PDF-test'), 'text/plain');

    expect(() => validateReceiptUpload(file)).toThrow(BadRequestException);
  });

  it('rejects files over 20 MB based on upload metadata', () => {
    const file = uploadFile(
      Buffer.from('%PDF-test'),
      'application/pdf',
      'large.pdf',
      20 * 1024 * 1024 + 1,
    );

    expect(() => validateReceiptUpload(file)).toThrow(BadRequestException);
  });

  it('normalizes valid PDF metadata', () => {
    const result = validateReceiptUpload(
      uploadFile(Buffer.from('%PDF-test'), 'application/pdf', 'bad/name'),
    );

    expect(result.filename).toBe('bad_name.pdf');
    expect(result.mimetype).toBe('application/pdf');
    expect(result.data).toBeInstanceOf(Uint8Array);
  });
});

describe('validatePdfUpload', () => {
  it('accepts matching PDF uploads', () => {
    const result = validatePdfUpload(
      uploadFile(Buffer.from('%PDF-test'), 'application/pdf', 'plan'),
    );

    expect(result.filename).toBe('plan.pdf');
    expect(result.mimetype).toBe('application/pdf');
  });

  it('rejects PDF uploads with mismatched content', () => {
    const file = uploadFile(Buffer.from('not pdf'), 'application/pdf');

    expect(() => validatePdfUpload(file)).toThrow(BadRequestException);
  });
});

describe('validateWastePlanUpload', () => {
  it('accepts matching XLSX uploads', () => {
    const result = validateWastePlanUpload(
      uploadFile(
        Buffer.from('PK\x03\x04payload'),
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'waste-plan',
      ),
    );

    expect(result.filename).toBe('waste-plan.xlsx');
    expect(result.mimetype).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('rejects mismatched spreadsheet uploads', () => {
    const file = uploadFile(
      Buffer.from('%PDF-test'),
      'application/vnd.ms-excel',
    );

    expect(() => validateWastePlanUpload(file)).toThrow(BadRequestException);
  });
});
