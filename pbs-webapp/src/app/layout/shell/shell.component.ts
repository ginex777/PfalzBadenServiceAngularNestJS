import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderNavComponent } from '../header-nav/header-nav.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { DrawerComponent } from '../../shared/ui/drawer/drawer.component';
import { ToastComponent } from '../../shared/ui/toast/toast.component';
import { OnboardingComponent } from '../../features/onboarding/onboarding.component';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { Benachrichtigung } from '../../core/models';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    HeaderNavComponent,
    DrawerComponent,
    SidebarComponent,
    ToastComponent,
    OnboardingComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isMobileNavOpen = signal(false);
  protected readonly unreadNotifications = signal<Benachrichtigung[]>([]);
  protected readonly isNotificationBannerVisible = signal(false);

  protected readonly userDisplayName = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return '';
    if (user.vorname && user.nachname) return `${user.vorname} ${user.nachname}`;
    return user.vorname || user.nachname || user.email;
  });

  ngOnInit(): void {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    this.http
      .get<Benachrichtigung[]>('/api/benachrichtigungen')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (notifications) => {
          const unread = notifications.filter((n) => !n.gelesen);
          if (unread.length > 0) {
            this.unreadNotifications.set(unread);
            this.isNotificationBannerVisible.set(true);
          }
        },
        error: () => {},
      });
  }

  protected markAllNotificationsRead(): void {
    this.http
      .post('/api/benachrichtigungen/alle-lesen', {})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isNotificationBannerVisible.set(false);
          this.unreadNotifications.set([]);
        },
        error: () => {},
      });
  }

  protected toggleMobileNav(): void {
    this.isMobileNavOpen.update((isOpen) => !isOpen);
  }

  protected closeMobileNav(): void {
    this.isMobileNavOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(e: KeyboardEvent): void {
    const target = e.target;
    const tag = target instanceof HTMLElement ? target.tagName : '';
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    switch (e.key) {
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
