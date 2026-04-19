import { Injectable, signal, computed, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

const STORAGE_KEY = 'pbs-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly isDark = signal<boolean>(this.leseGespeichertesThema());

  readonly label = computed(() => this.isDark() ? 'Dark Mode' : 'Light Mode');

  constructor() {
    this.anwenden(this.isDark());

    effect(() => {
      const dark = this.isDark();
      this.anwenden(dark);
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update(v => !v);
  }

  private leseGespeichertesThema(): boolean {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  }

  private anwenden(dark: boolean): void {
    if (dark) {
      this.document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      this.document.documentElement.removeAttribute('data-theme');
    }
  }
}
