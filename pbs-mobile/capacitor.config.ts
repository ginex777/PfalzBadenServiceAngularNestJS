import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.pbs.mobile',
  appName: 'PBS Mobile',
  webDir: 'dist/pbs-mobile/browser',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
};

export default config;
