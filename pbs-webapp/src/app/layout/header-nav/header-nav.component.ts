import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NavigationGroup, filterNavigationGroupsForRole } from '../navigation/navigation.config';

@Component({
  selector: 'app-header-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header-nav.component.html',
  styleUrl: './header-nav.component.scss',
})
export class HeaderNavComponent {
  readonly mobileMenuToggle = output<void>();
  readonly themeToggle = output<void>();

  readonly userDisplayName = input<string>('');
  readonly notificationCount = input<number>(0);
  readonly isDarkMode = input<boolean>(false);

  private readonly authService = inject(AuthService);

  protected readonly openGroupId = signal<string | null>(null);

  protected readonly navGroups = computed(() => {
    const user = this.authService.currentUser();
    const role = user?.rolle ?? null;
    return filterNavigationGroupsForRole(role);
  });

  protected toggleGroup(id: string): void {
    this.openGroupId.update((current) => (current === id ? null : id));
  }

  protected isDirectLinkGroup(group: NavigationGroup): boolean {
    return group.links.length === 1 && group.links[0]?.path === group.rootPath;
  }

  protected closeMenus(): void {
    this.openGroupId.set(null);
  }

  protected onNavigate(): void {
    this.closeMenus();
  }

  protected onMobileMenu(): void {
    this.mobileMenuToggle.emit();
  }

  protected onThemeToggle(): void {
    this.themeToggle.emit();
  }

  protected readonly hasNotifications = computed(() => this.notificationCount() > 0);

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Node)) return;
    const header = document.querySelector('.header-nav');
    if (!header) return;
    if (header.contains(target)) return;
    this.closeMenus();
  }
}
