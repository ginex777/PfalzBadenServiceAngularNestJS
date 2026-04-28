import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';
import { getRuntimeConfig } from './app/core/runtime/runtime-config';
import * as SentryCapacitor from '@sentry/capacitor';

const runtime = getRuntimeConfig();
const sentry = runtime.sentry;

if (environment.production && sentry?.dsn) {
  SentryCapacitor.init({
    dsn: sentry.dsn,
    environment: sentry.environment ?? 'production',
    release: sentry.release,
  });
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
