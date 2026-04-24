import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

type UserRole = 'admin' | 'readonly' | 'mitarbeiter';

const NAV_ACCESS: Record<string, readonly UserRole[]> = {
  '/dashboard': ['admin', 'readonly', 'mitarbeiter'],
  '/suche': ['admin', 'readonly', 'mitarbeiter'],

  '/kunden': ['admin', 'readonly'],
  '/rechnungen': ['admin', 'readonly'],
  '/angebote': ['admin', 'readonly'],
  '/wiederkehrende-rechnungen': ['admin', 'readonly'],

  '/buchhaltung': ['admin', 'readonly'],
  '/belege': ['admin', 'readonly'],
  '/euer': ['admin', 'readonly'],
  '/fixkosten': ['admin', 'readonly'],
  '/datev': ['admin', 'readonly'],

  '/muellplan': ['admin', 'mitarbeiter'],
  '/hausmeister': ['admin', 'mitarbeiter'],
  '/mobile-rueckmeldungen': ['admin', 'readonly', 'mitarbeiter'],
  '/nachweise': ['admin', 'readonly', 'mitarbeiter'],
  '/checklisten': ['admin', 'readonly', 'mitarbeiter'],

  '/mitarbeiter': ['admin'],
  '/vertraege': ['admin', 'readonly'],
  '/pdf-archiv': ['admin', 'readonly'],
  '/audit-log': ['admin', 'readonly'],
  '/einstellungen': ['admin'],
  '/benutzerverwaltung': ['admin'],
};

const NAV_GRUPPEN: NavGroup[] = [
  {
    id: 'uebersicht',
    label: 'Übersicht',
    items: [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/suche', label: 'Suche' },
    ],
  },
  {
    id: 'verkauf',
    label: 'Verkauf',
    items: [
      { path: '/kunden', label: 'Kunden' },
      { path: '/rechnungen', label: 'Rechnungen' },
      { path: '/angebote', label: 'Angebote' },
      { path: '/wiederkehrende-rechnungen', label: 'Wiederk. Rechnungen' },
    ],
  },
  {
    id: 'finanzen',
    label: 'Finanzen',
    items: [
      { path: '/buchhaltung', label: 'Buchhaltung' },
      { path: '/belege', label: 'Belege' },
      { path: '/euer', label: 'EÜR' },
      { path: '/fixkosten', label: 'Fixkosten' },
      { path: '/datev', label: 'DATEV Export' },
    ],
  },
  {
    id: 'betrieb',
    label: 'Betrieb',
    items: [
      { path: '/muellplan', label: 'Müllplan' },
      { path: '/hausmeister', label: 'Hausmeister' },
      { path: '/mobile-rueckmeldungen', label: 'Mobile RÃ¼ckmeldungen' },
      { path: '/nachweise', label: 'Nachweise' },
      { path: '/checklisten', label: 'Checklisten' },
    ],
  },
  {
    id: 'verwaltung',
    label: 'Verwaltung',
    items: [
      { path: '/mitarbeiter', label: 'Mitarbeiter' },
      { path: '/vertraege', label: 'Verträge' },
      { path: '/pdf-archiv', label: 'PDF Archiv' },
      { path: '/audit-log', label: 'Audit-Log' },
      { path: '/einstellungen', label: 'Einstellungen' },
    ],
  },
  {
    id: 'benutzerverwaltung',
    label: 'Benutzer',
    items: [{ path: '/benutzerverwaltung', label: 'Benutzerverwaltung' }],
  },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly geschlossen = output<void>();
  readonly notifAnzahl = input(0);
  readonly darkMode = input(false);
  readonly darkModeGeaendert = output<void>();

  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly navGruppen = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];

    const role = user.rolle as UserRole;
    return NAV_GRUPPEN.map((g) => ({
      ...g,
      items: g.items.filter((i) => (NAV_ACCESS[i.path] ?? []).includes(role)),
    })).filter((g) => g.items.length > 0);
  });

  /** Which groups are currently open (multi-expand) */
  protected readonly offeneGruppen = signal<Set<string>>(new Set([this._initialGroup()]));

  protected readonly nutzerAnzeige = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return '';
    if (user.vorname && user.nachname) return `${user.vorname} ${user.nachname}`;
    return user.vorname || user.nachname || user.email;
  });

  protected toggleGruppe(id: string): void {
    this.offeneGruppen.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  protected istOffen(id: string): boolean {
    return this.offeneGruppen().has(id);
  }

  protected navigiertZu(): void {
    this.geschlossen.emit();
  }

  private _initialGroup(): string {
    const url = this.router.url;
    for (const g of NAV_GRUPPEN) {
      if (g.items.some((i) => url.startsWith(i.path))) return g.id;
    }
    return 'uebersicht';
  }
}
