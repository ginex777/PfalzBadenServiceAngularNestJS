import { Component, signal, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { MobileAuthService } from '../../core/auth.service';
import { StempelService, StempelEintrag } from '../../core/stempel.service';

@Component({
  selector: 'app-tagesuebersicht',
  standalone: true,
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
  ],
  templateUrl: './tagesuebersicht.page.html',
  styleUrl: './tagesuebersicht.page.scss',
})
export class TagesuebersichtPage implements OnInit {
  private readonly auth = inject(MobileAuthService);
  private readonly stempel = inject(StempelService);

  entries = signal<StempelEintrag[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    const employeeId = this.auth.currentUser()?.mitarbeiterId ?? null;
    if (!employeeId) {
      this.entries.set([]);
      this.isLoading.set(false);
      return;
    }

    this.stempel.getTimeEntries(employeeId).subscribe({
      next: (rows) => {
        this.entries.set(rows);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  totalMinutes(): number {
    return this.entries()
      .filter((e) => e.dauer_minuten != null)
      .reduce((sum, e) => sum + (e.dauer_minuten ?? 0), 0);
  }

  formatDuration(min: number | null): string {
    if (min == null) return '(laeuft)';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }
}
