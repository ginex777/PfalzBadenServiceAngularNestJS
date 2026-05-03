export interface ApiErrorBody {
  code?: string;
  message?: string;
  statusCode?: number;
}

export function getApiErrorBody(error: unknown): ApiErrorBody | null {
  if (!isRecord(error)) return null;
  const body = error['error'];
  if (!isRecord(body)) return null;

  return {
    code: readString(body, 'code'),
    message: readString(body, 'message'),
    statusCode: readNumber(body, 'statusCode'),
  };
}

export function getApiErrorMessage(error: unknown): string | null {
  return getApiErrorBody(error)?.message ?? null;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function readNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
