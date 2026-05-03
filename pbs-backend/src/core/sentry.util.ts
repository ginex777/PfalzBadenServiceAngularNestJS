import * as Sentry from '@sentry/nestjs';

export type SentryConfig = {
  dsn: string;
  environment: string;
  release?: string;
};

export function getSentryConfig(): SentryConfig | null {
  const dsn = process.env['SENTRY_DSN'];
  if (!dsn) return null;

  const nodeEnv = process.env['NODE_ENV'] ?? 'development';
  const environment = process.env['SENTRY_ENVIRONMENT'] ?? nodeEnv;
  const release = process.env['SENTRY_RELEASE'];

  return { dsn, environment, release };
}

export function isSentryEnabled(): boolean {
  const config = getSentryConfig();
  if (!config) return false;
  return (process.env['NODE_ENV'] ?? 'development') === 'production';
}

export function initSentry(): void {
  const config = getSentryConfig();
  if (!config) return;

  if ((process.env['NODE_ENV'] ?? 'development') !== 'production') {
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
  });
}

export { Sentry };
