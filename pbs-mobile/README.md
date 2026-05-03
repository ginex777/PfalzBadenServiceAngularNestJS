# PBS Mobile

Angular + Capacitor mobile app for field workflows.

## Prerequisites

- Node.js 20+
- Android Studio (for Android build/run)
- Xcode + macOS (for iOS build/run)

## Install

```powershell
npm install --prefix pbs-mobile
```

## Web Build

```powershell
npm run build --prefix pbs-mobile
```

## Local Dev (Web / API Proxy)

By default the mobile app calls the API via a relative `/api/...` base URL in development.
`npm run start` configures an Angular dev-server proxy to the backend.

```powershell
# Optional: override backend target for the proxy (defaults to http://localhost:3000)
$env:PBS_API_PROXY_TARGET = "http://localhost:3000"

cd pbs-mobile
npm run start
```

## Capacitor Setup

First-time platform setup:

```powershell
cd pbs-mobile
npm run cap:add:android
npm run cap:add:ios
```

Sync web assets to native projects:

```powershell
cd pbs-mobile
npm run cap:sync
```

## Android Device Run (Windows)

```powershell
cd pbs-mobile
npm run build:mobile
npm run cap:sync
npm run cap:open:android
```

Then run from Android Studio on emulator or physical device.

## iOS Build Path (Mac/CI)

Windows cannot produce `.ipa` locally.

Validate iOS in macOS/CI:

```powershell
cd pbs-mobile
npm run build:mobile
npm run cap:sync
npm run cap:open:ios
```

Then archive/sign in Xcode.

## Smoke Flow

1. Login on device.
2. Verify app restart keeps session.
3. Open `Heute` (default tab).
4. Switch to `Stempeluhr`, start/stop a stamp entry.
5. Optional: test `Foto` upload.
