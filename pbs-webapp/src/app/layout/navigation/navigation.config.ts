export type UserRole = 'admin' | 'readonly' | 'mitarbeiter';

export interface NavigationLink {
  readonly path: string;
  readonly label: string;
  readonly roles: readonly UserRole[];
}

export interface NavigationGroup {
  readonly id: string;
  readonly label: string;
  readonly rootPath: string;
  readonly links: readonly NavigationLink[];
}

const NAV_ACCESS: Record<string, readonly UserRole[]> = {
  '/uebersicht': ['admin', 'readonly', 'mitarbeiter'],

  '/operativ': ['admin', 'readonly', 'mitarbeiter'],

  '/finanzen/rechnungen': ['admin', 'readonly'],
  '/finanzen/angebote': ['admin', 'readonly'],
  '/finanzen/buchhaltung': ['admin', 'readonly'],

  '/verwaltung/kunden': ['admin', 'readonly'],
  '/verwaltung/objekte': ['admin', 'readonly'],
  '/verwaltung/mitarbeiter': ['admin'],
  '/verwaltung/vertraege': ['admin', 'readonly'],
  '/verwaltung/pdf-archiv': ['admin', 'readonly'],
  '/verwaltung/audit-log': ['admin', 'readonly'],
  '/verwaltung/einstellungen': ['admin'],

  '/benutzer/verwaltung': ['admin'],
};

export const NAVIGATION_GROUPS: readonly NavigationGroup[] = [
  {
    id: 'uebersicht',
    label: 'Übersicht',
    rootPath: '/uebersicht',
    links: [{ path: '/uebersicht', label: 'Dashboard', roles: NAV_ACCESS['/uebersicht'] ?? [] }],
  },
  {
    id: 'operativ',
    label: 'Operativ',
    rootPath: '/operativ',
    links: [{ path: '/operativ', label: 'Operativ', roles: NAV_ACCESS['/operativ'] ?? [] }],
  },
  {
    id: 'finanzen',
    label: 'Finanzen',
    rootPath: '/finanzen',
    links: [
      {
        path: '/finanzen/rechnungen',
        label: 'Rechnungen',
        roles: NAV_ACCESS['/finanzen/rechnungen'] ?? [],
      },
      {
        path: '/finanzen/angebote',
        label: 'Angebote',
        roles: NAV_ACCESS['/finanzen/angebote'] ?? [],
      },
    ],
  },
  {
    id: 'buchhaltung',
    label: 'Buchhaltung',
    rootPath: '/finanzen/buchhaltung',
    links: [
      {
        path: '/finanzen/buchhaltung',
        label: 'Buchhaltung',
        roles: NAV_ACCESS['/finanzen/buchhaltung'] ?? [],
      },
    ],
  },
  {
    id: 'verwaltung',
    label: 'Verwaltung',
    rootPath: '/verwaltung',
    links: [
      {
        path: '/verwaltung/kunden',
        label: 'Kunden',
        roles: NAV_ACCESS['/verwaltung/kunden'] ?? [],
      },
      {
        path: '/verwaltung/objekte',
        label: 'Objekte',
        roles: NAV_ACCESS['/verwaltung/objekte'] ?? [],
      },
      {
        path: '/verwaltung/mitarbeiter',
        label: 'Mitarbeiter',
        roles: NAV_ACCESS['/verwaltung/mitarbeiter'] ?? [],
      },
      {
        path: '/verwaltung/vertraege',
        label: 'Verträge',
        roles: NAV_ACCESS['/verwaltung/vertraege'] ?? [],
      },
      {
        path: '/verwaltung/pdf-archiv',
        label: 'PDF-Archiv',
        roles: NAV_ACCESS['/verwaltung/pdf-archiv'] ?? [],
      },
      {
        path: '/verwaltung/audit-log',
        label: 'Audit-Log',
        roles: NAV_ACCESS['/verwaltung/audit-log'] ?? [],
      },
      {
        path: '/verwaltung/einstellungen',
        label: 'Einstellungen',
        roles: NAV_ACCESS['/verwaltung/einstellungen'] ?? [],
      },
    ],
  },
  {
    id: 'benutzer',
    label: 'Benutzer',
    rootPath: '/benutzer',
    links: [
      {
        path: '/benutzer/verwaltung',
        label: 'Benutzerverwaltung',
        roles: NAV_ACCESS['/benutzer/verwaltung'] ?? [],
      },
    ],
  },
];

export function filterNavigationGroupsForRole(role: UserRole | null): NavigationGroup[] {
  if (!role) return [];
  return NAVIGATION_GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((link) => link.roles.includes(role)),
  })).filter((group) => group.links.length > 0);
}

export function getInitialOpenGroupId(currentUrl: string): string {
  for (const group of NAVIGATION_GROUPS) {
    if (currentUrl === group.rootPath || currentUrl.startsWith(`${group.rootPath}/`))
      return group.id;
    if (group.links.some((link) => currentUrl.startsWith(link.path))) return group.id;
  }
  return 'uebersicht';
}
