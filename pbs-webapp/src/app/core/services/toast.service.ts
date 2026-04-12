import { Injectable, signal } from '@angular/core';

export type ToastTyp = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  nachricht: string;
  typ: ToastTyp;
}

let naechsteId = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  success(nachricht: string): void {
    this._hinzufuegen(nachricht, 'success');
  }

  error(nachricht: string): void {
    this._hinzufuegen(nachricht, 'error', 6000);
  }

  warning(nachricht: string): void {
    this._hinzufuegen(nachricht, 'warning', 5000);
  }

  info(nachricht: string): void {
    this._hinzufuegen(nachricht, 'info');
  }

  entfernen(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private _hinzufuegen(nachricht: string, typ: ToastTyp, dauer = 3500): void {
    const id = ++naechsteId;
    this.toasts.update(list => [...list, { id, nachricht, typ }]);
    setTimeout(() => this.entfernen(id), dauer);
  }
}
