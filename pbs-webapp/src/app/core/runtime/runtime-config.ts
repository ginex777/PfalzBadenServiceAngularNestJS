export type RuntimeConfig = {
  sentry?: {
    dsn?: string;
    environment?: string;
    release?: string;
  };
};

declare global {
  interface Window {
    __PBS_RUNTIME__?: RuntimeConfig;
  }
}

export function getRuntimeConfig(): RuntimeConfig {
  return (typeof window !== 'undefined' && window.__PBS_RUNTIME__) ? window.__PBS_RUNTIME__ : {};
}

