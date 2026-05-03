import { BadRequestException } from '@nestjs/common';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

const ALLOWED_RECEIPT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const PDF_MIME_TYPE = 'application/pdf';
const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XLS_MIME_TYPE = 'application/vnd.ms-excel';

export interface ValidatedUploadFile {
  filename: string;
  mimetype: string;
  filesize: number;
  data: Uint8Array<ArrayBuffer>;
}

export function toPrismaBytes(buffer: Buffer): Uint8Array<ArrayBuffer> {
  const copy = new ArrayBuffer(buffer.byteLength);
  const bytes = new Uint8Array(copy);
  bytes.set(buffer);
  return bytes;
}

export function validateReceiptUpload(
  file: Express.Multer.File | undefined,
): ValidatedUploadFile {
  if (!file) {
    throw new BadRequestException('No receipt file uploaded');
  }

  if (!file.buffer?.length) {
    throw new BadRequestException('Uploaded receipt file is empty');
  }

  if (
    file.size > MAX_UPLOAD_BYTES ||
    file.buffer.byteLength > MAX_UPLOAD_BYTES
  ) {
    throw new BadRequestException('Uploaded receipt file exceeds 20 MB');
  }

  if (!ALLOWED_RECEIPT_MIME_TYPES.has(file.mimetype)) {
    throw new BadRequestException('Unsupported receipt file type');
  }

  const detectedMimeType = detectReceiptMimeType(file.buffer);
  if (detectedMimeType !== file.mimetype) {
    throw new BadRequestException(
      'Receipt file type does not match its content',
    );
  }

  return {
    filename: sanitizeStoredFilename(file.originalname, detectedMimeType),
    mimetype: detectedMimeType,
    filesize: file.size,
    data: toPrismaBytes(file.buffer),
  };
}

export function validatePdfUpload(
  file: Express.Multer.File | undefined,
  label = 'PDF file',
): ValidatedUploadFile {
  const upload = validateRequiredUpload(file, label);
  if (
    upload.mimetype !== PDF_MIME_TYPE ||
    detectDocumentMimeType(upload.buffer) !== PDF_MIME_TYPE
  ) {
    throw new BadRequestException(`${label} must be a PDF`);
  }

  return toValidatedUploadFile(upload, PDF_MIME_TYPE);
}

export function validateWastePlanUpload(
  file: Express.Multer.File | undefined,
): ValidatedUploadFile {
  const upload = validateRequiredUpload(file, 'Waste plan file');
  const detectedMimeType = detectDocumentMimeType(upload.buffer);
  const allowed = new Set([PDF_MIME_TYPE, XLSX_MIME_TYPE, XLS_MIME_TYPE]);

  if (!allowed.has(upload.mimetype) || detectedMimeType !== upload.mimetype) {
    throw new BadRequestException(
      'Waste plan file type does not match its content',
    );
  }

  return toValidatedUploadFile(upload, detectedMimeType);
}

function detectReceiptMimeType(buffer: Buffer): string | null {
  if (buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    return 'application/pdf';
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }

  if (
    buffer.subarray(0, 4).equals(Buffer.from('RIFF')) &&
    buffer.subarray(8, 12).equals(Buffer.from('WEBP'))
  ) {
    return 'image/webp';
  }

  return null;
}

function validateRequiredUpload(
  file: Express.Multer.File | undefined,
  label: string,
): Express.Multer.File {
  if (!file) {
    throw new BadRequestException(`No ${label} uploaded`);
  }

  if (!file.buffer?.length) {
    throw new BadRequestException(`Uploaded ${label} is empty`);
  }

  if (
    file.size > MAX_UPLOAD_BYTES ||
    file.buffer.byteLength > MAX_UPLOAD_BYTES
  ) {
    throw new BadRequestException(`Uploaded ${label} exceeds 20 MB`);
  }

  return file;
}

function detectDocumentMimeType(buffer: Buffer): string | null {
  if (buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    return PDF_MIME_TYPE;
  }

  if (buffer.subarray(0, 4).equals(Buffer.from('PK\x03\x04'))) {
    return XLSX_MIME_TYPE;
  }

  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
  ) {
    return XLS_MIME_TYPE;
  }

  return null;
}

function toValidatedUploadFile(
  file: Express.Multer.File,
  mimetype: string,
): ValidatedUploadFile {
  return {
    filename: sanitizeStoredFilename(file.originalname, mimetype),
    mimetype,
    filesize: file.size,
    data: toPrismaBytes(file.buffer),
  };
}

function sanitizeStoredFilename(filename: string, mimetype: string): string {
  const extension = extensionForMimeType(mimetype);
  const cleaned = filename
    .replace(/["\\/:;<>|?*]+/g, '_')
    .replace(/[\r\n\t]+/g, '_')
    .replaceAll('\0', '_')
    .replace(/_+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);

  if (!cleaned) {
    return `beleg${extension}`;
  }

  return cleaned.toLowerCase().endsWith(extension)
    ? cleaned
    : `${cleaned}${extension}`;
}

function extensionForMimeType(mimetype: string): string {
  switch (mimetype) {
    case 'application/pdf':
      return '.pdf';
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case XLSX_MIME_TYPE:
      return '.xlsx';
    case XLS_MIME_TYPE:
      return '.xls';
    default:
      return '.bin';
  }
}
