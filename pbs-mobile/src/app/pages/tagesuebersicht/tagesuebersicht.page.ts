import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { StempelService, StempelEintrag } from '../../core/stempel.service';

@Component({
  selector: 'app-tagesuebersicht',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './tagesuebersicht.page.html',
  styleUrl: './tagesuebersicht.page.scss',
})
export class TagesuebersichtPage implements OnInit {
  private readonly stempel = inject(StempelService);

  eintraege = signal<StempelEintrag[]>([]);
  laedt = signal(true);
  // Hardcoded for demo — in production read from linked Mitarbeiter
  private mitarbeiterId = 1;

  ngOnInit() {
    this.stempel.zeiterfassung(this.mitarbeiterId).subscribe({
      next: (rows) => {
        this.eintraege.set(rows);
        this.laedt.set(false);
      },
      error: () => this.laedt.set(false),
    });
  }

  gesamtMinuten(): number {
    return this.eintraege()
      .filter((e) => e.dauer_minuten != null)
      .reduce((sum, e) => sum + (e.dauer_minuten ?? 0), 0);
  }

  formatDauer(min: number | null): string {
    if (min == null) return '(läuft)';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }
}
