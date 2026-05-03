import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';
import { getRuntimeConfig } from './app/core/runtime/runtime-config';

async function initializeSentry(): Promise<void> {
  const runtime = getRuntimeConfig();
  const sentry = runtime.sentry;
  if (!environment.production || !sentry?.dsn) return;

  const SentryCapacitor = await import('@sentry/capacitor');
  SentryCapacitor.init({
    dsn: sentry.dsn,
    environment: sentry.environment ?? 'production',
    release: sentry.release,
  });
}

initializeSentry()
  .then(() => bootstrapApplication(App, appConfig))
  .catch((err) => console.error(err));
