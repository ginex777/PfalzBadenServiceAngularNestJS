import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'pbs-aktiver-nutzer';

@Injectable({ providedIn: 'root' })
export class NutzerService {
  readonly aktiverNutzer = signal<string>(this._laden());

  setzen(name: string): void {
    const bereinigt = name.trim().slice(0, 100);
    this.aktiverNutzer.set(bereinigt);
    if (bereinigt) {
      localStorage.setItem(STORAGE_KEY, bereinigt);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private _laden(): string {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  }
}
