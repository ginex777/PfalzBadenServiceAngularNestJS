import { Injectable, computed, signal, DestroyRef, inject } from '@angular/core';

export interface ActiveStamp {
  id: number;
  start: Date;
}

@Injectable({ providedIn: 'root' })
export class TimerStateService {
  private readonly destroyRef = inject(DestroyRef);

  readonly activeTimer = signal<ActiveStamp | null>(null);
  readonly runtime = signal('00:00:00');
  readonly isActive = computed(() => this.activeTimer() != null);

  private timer?: ReturnType<typeof setInterval>;

  constructor() {
    this.timer = setInterval(() => this.updateRuntime(), 1000);
    this.destroyRef.onDestroy(() => {
      if (this.timer) {
        clearInterval(this.timer);
      }
    });
  }

  setActive(stamp: ActiveStamp): void {
    this.activeTimer.set(stamp);
  }

  clearActive(): void {
    this.activeTimer.set(null);
    this.runtime.set('00:00:00');
  }

  private updateRuntime(): void {
    const start = this.activeTimer()?.start;
    if (!start) return;

    const diff = Math.floor((Date.now() - start.getTime()) / 1000);
    const h = Math.floor(diff / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((diff % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    this.runtime.set(`${h}:${m}:${s}`);
  }
}
