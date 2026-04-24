import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  UserRole,
  filterNavigationGroupsForRole,
  getInitialOpenGroupId,
} from '../navigation/navigation.config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly closed = output<void>();
  readonly notificationCount = input(0);
  readonly isDarkMode = input(false);
  readonly darkModeChange = output<void>();

  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly navGroups = computed(() => {
    const user = this.authService.currentUser();
    const role: UserRole | null = user?.rolle ?? null;
    return filterNavigationGroupsForRole(role);
  });

  protected readonly openGroupIds = signal<Set<string>>(new Set([getInitialOpenGroupId(this.router.url)]));

  protected readonly userDisplayName = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return '';
    if (user.vorname && user.nachname) return `${user.vorname} ${user.nachname}`;
    return user.vorname || user.nachname || user.email;
  });

  protected toggleGroup(id: string): void {
    this.openGroupIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected isOpen(id: string): boolean {
    return this.openGroupIds().has(id);
  }

  protected onNavigate(): void {
    this.closed.emit();
  }
}
