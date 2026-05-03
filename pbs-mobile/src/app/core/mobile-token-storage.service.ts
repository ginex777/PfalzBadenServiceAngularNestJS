import { Injectable } from '@angular/core';
import { KeychainAccess, SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Preferences } from '@capacitor/preferences';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const KEY_PREFIX = 'pbs-auth_';

@Injectable({ providedIn: 'root' })
export class MobileTokenStorageService {
  private configurePromise: Promise<void> | null = null;

  async getAccessToken(): Promise<string | null> {
    await this.configure();
    return SecureStorage.getItem(ACCESS_TOKEN_KEY);
  }

  async getRefreshToken(): Promise<string | null> {
    await this.configure();
    return SecureStorage.getItem(REFRESH_TOKEN_KEY);
  }

  async setTokens(tokens: {
    accessToken: string;
    refreshToken: string;
  }): Promise<void> {
    await this.configure();
    await Promise.all([
      SecureStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken),
      SecureStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  }

  async clearTokens(): Promise<void> {
    await this.configure();
    await Promise.all([
      SecureStorage.removeItem(ACCESS_TOKEN_KEY),
      SecureStorage.removeItem(REFRESH_TOKEN_KEY),
      Preferences.remove({ key: ACCESS_TOKEN_KEY }),
      Preferences.remove({ key: REFRESH_TOKEN_KEY }),
    ]);
  }

  async migrateLegacyPreferenceTokens(): Promise<void> {
    await this.configure();
    const [{ value: accessToken }, { value: refreshToken }] = await Promise.all([
      Preferences.get({ key: ACCESS_TOKEN_KEY }),
      Preferences.get({ key: REFRESH_TOKEN_KEY }),
    ]);

    if (accessToken && refreshToken) {
      await this.setTokens({ accessToken, refreshToken });
    }

    await Promise.all([
      Preferences.remove({ key: ACCESS_TOKEN_KEY }),
      Preferences.remove({ key: REFRESH_TOKEN_KEY }),
    ]);
  }

  private configure(): Promise<void> {
    this.configurePromise ??= Promise.all([
      SecureStorage.setKeyPrefix(KEY_PREFIX),
      SecureStorage.setSynchronize(false),
      SecureStorage.setDefaultKeychainAccess(KeychainAccess.whenUnlockedThisDeviceOnly),
    ]).then(() => undefined);
    return this.configurePromise;
  }
}
