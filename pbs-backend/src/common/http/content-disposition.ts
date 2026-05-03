export type ContentDispositionType = 'inline' | 'attachment';

const FALLBACK_FILENAME = 'download';

export function sanitizeDownloadFilename(
  filename: string | null | undefined,
  fallback = FALLBACK_FILENAME,
): string {
  const cleaned = (filename ?? '')
    .replace(/["\\/:;<>|?*]+/g, '_')
    .replace(/[\r\n\t]+/g, '_')
    .replaceAll('\0', '_')
    .replace(/_+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || fallback;
}

export function contentDispositionHeader(
  disposition: ContentDispositionType,
  filename: string | null | undefined,
): string {
  const safeFilename = sanitizeDownloadFilename(filename);
  const asciiFallback =
    safeFilename
      .normalize('NFKD')
      .replace(/[^\x20-\x7e]+/g, '')
      .replace(/[^A-Za-z0-9._ -]+/g, '_')
      .trim() || FALLBACK_FILENAME;
  const encodedFilename = encodeURIComponent(safeFilename).replace(
    /['()]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodedFilename}`;
}
