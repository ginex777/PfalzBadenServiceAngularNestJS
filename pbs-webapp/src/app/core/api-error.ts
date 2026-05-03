export function getApiErrorMessage(error: unknown): string | null {
  if (!isRecord(error)) return null;
  const body = error['error'];
  if (!isRecord(body)) return null;
  const message = body['message'];
  return typeof message === 'string' ? message : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
