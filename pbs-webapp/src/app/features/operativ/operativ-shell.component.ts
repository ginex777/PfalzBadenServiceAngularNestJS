import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type OperativRole = 'admin' | 'readonly' | 'mitarbeiter';

interface OperativTab {
  path: string;
  label: string;
  roles: readonly OperativRole[];
}

const TABS: readonly OperativTab[] = [
  { path: 'muellplan', label: 'Müllplan', roles: ['admin', 'mitarbeiter'] },
  { path: 'hausmeister', label: 'Sonstige Tätigkeiten', roles: ['admin', 'mitarbeiter'] },
  { path: 'stempeluhr', label: 'Stempeluhr', roles: ['admin', 'mitarbeiter'] },
  { path: 'foto-upload', label: 'Foto Upload', roles: ['admin', 'mitarbeiter'] },
  { path: 'mobile-rueckmeldungen', label: 'Mobile Rückmeldungen', roles: ['admin', 'readonly', 'mitarbeiter'] },
  { path: 'nachweise', label: 'Nachweise', roles: ['admin', 'readonly', 'mitarbeiter'] },
  { path: 'checklisten', label: 'Checklisten', roles: ['admin', 'readonly', 'mitarbeiter'] },
  { path: 'aufgaben', label: 'Aufgaben', roles: ['admin', 'readonly'] },
];

@Component({
  selector: 'app-operativ-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="operativ-subnav">
      @for (tab of visibleTabs(); track tab.path) {
        <a [routerLink]="tab.path" routerLinkActive="active">{{ tab.label }}</a>
      }
    </nav>
    <div class="operativ-content">
      <router-outlet />
    </div>
  `,
  styles: [`
    .operativ-subnav {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border-strong);
      padding: 0 1.5rem;
      background: var(--surface);
      overflow-x: auto;
    }
    .operativ-subnav a {
      padding: 0.625rem 1.125rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--gray-400);
      text-decoration: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      white-space: nowrap;
      transition: color 0.15s, border-color 0.15s;
    }
    .operativ-subnav a:hover {
      color: var(--gray-600);
    }
    .operativ-subnav a.active {
      color: var(--primary-solid);
      border-bottom-color: var(--primary-solid);
    }
    .operativ-content {
      padding: 0 1.5rem;
    }
  `],
})
export class OperativShellComponent {
  private readonly auth = inject(AuthService);

  protected readonly visibleTabs = computed(() => {
    const role = this.auth.currentUser()?.rolle ?? null;
    if (!role) return [];
    return TABS.filter((t) => (t.roles as readonly string[]).includes(role));
  });
}
