import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
}

interface ConfirmState extends Required<ConfirmOptions> {
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _state = signal<ConfirmState | null>(null);
  readonly state = this._state.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this._state.set({
        title: options.title ?? 'Bestätigung erforderlich',
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Löschen',
        cancelLabel: options.cancelLabel ?? 'Abbrechen',
        isDangerous: options.isDangerous ?? true,
        resolve,
      });
    });
  }

  confirmed(): void {
    this._state()?.resolve(true);
    this._state.set(null);
  }

  canceled(): void {
    this._state()?.resolve(false);
    this._state.set(null);
  }
}
