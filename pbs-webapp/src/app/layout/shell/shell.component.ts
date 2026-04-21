import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastComponent } from '../../shared/ui/toast/toast.component';
import { OnboardingComponent } from '../../features/onboarding/onboarding.component';
import { AuthService } from '../../core/services/auth.service';
import { Benachrichtigung } from '../../core/models';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent, ToastComponent, OnboardingComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);

  protected readonly mobileSidebarOffen = signal(false);
  protected readonly ungeleseneNotifs = signal<Benachrichtigung[]>([]);
  protected readonly notifBannerSichtbar = signal(false);
  protected readonly darkMode = signal(false);

  protected readonly nutzerAnzeige = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return '';
    if (user.vorname && user.nachname) return `${user.vorname} ${user.nachname}`;
    return user.vorname || user.nachname || user.email;
  });

  ngOnInit(): void {
    this.notifenLaden();
    const gespeichert = localStorage.getItem('pbs-theme');
    if (gespeichert === 'dark') this.darkModeAktivieren(true);
  }

  private notifenLaden(): void {
    this.http.get<Benachrichtigung[]>('/api/benachrichtigungen').subscribe({
      next: (notifs) => {
        const ungelesen = notifs.filter((n) => !n.gelesen);
        if (ungelesen.length > 0) {
          this.ungeleseneNotifs.set(ungelesen);
          this.notifBannerSichtbar.set(true);
        }
      },
      error: () => {},
    });
  }

  protected alleGelesenMarkieren(): void {
    this.http.post('/api/benachrichtigungen/alle-lesen', {}).subscribe({
      next: () => {
        this.notifBannerSichtbar.set(false);
        this.ungeleseneNotifs.set([]);
      },
      error: () => {},
    });
  }

  protected mobileSidebarUmschalten(): void {
    this.mobileSidebarOffen.update((offen) => !offen);
  }

  protected mobileSidebarSchliessen(): void {
    this.mobileSidebarOffen.set(false);
  }

  protected darkModeUmschalten(): void {
    this.darkModeAktivieren(!this.darkMode());
  }

  private darkModeAktivieren(aktiv: boolean): void {
    this.darkMode.set(aktiv);
    document.documentElement.setAttribute('data-theme', aktiv ? 'dark' : 'light');
    localStorage.setItem('pbs-theme', aktiv ? 'dark' : 'light');
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(e: KeyboardEvent): void {
    // Ctrl+K / Cmd+K → globale Suche (immer aktiv)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.router.navigate(['/suche']);
      return;
    }

    const tag = (e.target as HTMLElement).tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    switch (e.key) {
      case '/':
        e.preventDefault();
        this.router.navigate(['/suche']);
        break;
      case 'n':
        this.router.navigate(['/rechnungen'], { state: { neueRechnung: true } });
        break;
      case 'a':
        this.router.navigate(['/angebote'], { state: { neuesAngebot: true } });
        break;
      case 'k':
        this.router.navigate(['/kunden']);
        break;
      case 'b':
        this.router.navigate(['/buchhaltung']);
        break;
      case 'h':
        this.router.navigate(['/hausmeister']);
        break;
      case 'm':
        this.router.navigate(['/muellplan']);
        break;
    }
  }
}
