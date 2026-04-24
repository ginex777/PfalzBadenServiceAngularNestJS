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
  '/uebersicht/suche': ['admin', 'readonly', 'mitarbeiter'],

  '/operativ/muellplan': ['admin', 'mitarbeiter'],
  '/operativ/hausmeister': ['admin', 'mitarbeiter'],
  '/operativ/stempeluhr': ['admin', 'mitarbeiter'],
  '/operativ/foto-upload': ['admin', 'mitarbeiter'],
  '/operativ/mobile-rueckmeldungen': ['admin', 'readonly', 'mitarbeiter'],
  '/operativ/nachweise': ['admin', 'readonly', 'mitarbeiter'],
  '/operativ/checklisten': ['admin', 'readonly', 'mitarbeiter'],

  '/finanzen/rechnungen': ['admin', 'readonly'],
  '/finanzen/angebote': ['admin', 'readonly'],
  '/finanzen/wiederkehrende-rechnungen': ['admin', 'readonly'],
  '/finanzen/buchhaltung': ['admin', 'readonly'],
  '/finanzen/belege': ['admin', 'readonly'],
  '/finanzen/euer': ['admin', 'readonly'],
  '/finanzen/fixkosten': ['admin', 'readonly'],
  '/finanzen/datev': ['admin', 'readonly'],

  '/verwaltung/kunden': ['admin', 'readonly'],
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
    links: [
      { path: '/uebersicht', label: 'Dashboard', roles: NAV_ACCESS['/uebersicht'] ?? [] },
      { path: '/uebersicht/suche', label: 'Suche', roles: NAV_ACCESS['/uebersicht/suche'] ?? [] },
    ],
  },
  {
    id: 'operativ',
    label: 'Operativ',
    rootPath: '/operativ',
    links: [
      { path: '/operativ/muellplan', label: 'Müllplan', roles: NAV_ACCESS['/operativ/muellplan'] ?? [] },
      { path: '/operativ/hausmeister', label: 'Hausmeister', roles: NAV_ACCESS['/operativ/hausmeister'] ?? [] },
      { path: '/operativ/stempeluhr', label: 'Stempeluhr', roles: NAV_ACCESS['/operativ/stempeluhr'] ?? [] },
      { path: '/operativ/foto-upload', label: 'Foto Upload', roles: NAV_ACCESS['/operativ/foto-upload'] ?? [] },
      {
        path: '/operativ/mobile-rueckmeldungen',
        label: 'Mobile Rückmeldungen',
        roles: NAV_ACCESS['/operativ/mobile-rueckmeldungen'] ?? [],
      },
      { path: '/operativ/nachweise', label: 'Nachweise', roles: NAV_ACCESS['/operativ/nachweise'] ?? [] },
      { path: '/operativ/checklisten', label: 'Checklisten', roles: NAV_ACCESS['/operativ/checklisten'] ?? [] },
    ],
  },
  {
    id: 'finanzen',
    label: 'Finanzen',
    rootPath: '/finanzen',
    links: [
      { path: '/finanzen/rechnungen', label: 'Rechnungen', roles: NAV_ACCESS['/finanzen/rechnungen'] ?? [] },
      { path: '/finanzen/angebote', label: 'Angebote', roles: NAV_ACCESS['/finanzen/angebote'] ?? [] },
      {
        path: '/finanzen/wiederkehrende-rechnungen',
        label: 'Wiederk. Rechnungen',
        roles: NAV_ACCESS['/finanzen/wiederkehrende-rechnungen'] ?? [],
      },
      { path: '/finanzen/buchhaltung', label: 'Buchhaltung', roles: NAV_ACCESS['/finanzen/buchhaltung'] ?? [] },
      { path: '/finanzen/belege', label: 'Belege', roles: NAV_ACCESS['/finanzen/belege'] ?? [] },
      { path: '/finanzen/euer', label: 'EÜR', roles: NAV_ACCESS['/finanzen/euer'] ?? [] },
      { path: '/finanzen/fixkosten', label: 'Fixkosten', roles: NAV_ACCESS['/finanzen/fixkosten'] ?? [] },
      { path: '/finanzen/datev', label: 'DATEV Export', roles: NAV_ACCESS['/finanzen/datev'] ?? [] },
    ],
  },
  {
    id: 'verwaltung',
    label: 'Verwaltung',
    rootPath: '/verwaltung',
    links: [
      { path: '/verwaltung/kunden', label: 'Kunden', roles: NAV_ACCESS['/verwaltung/kunden'] ?? [] },
      { path: '/verwaltung/mitarbeiter', label: 'Mitarbeiter', roles: NAV_ACCESS['/verwaltung/mitarbeiter'] ?? [] },
      { path: '/verwaltung/vertraege', label: 'Verträge', roles: NAV_ACCESS['/verwaltung/vertraege'] ?? [] },
      { path: '/verwaltung/pdf-archiv', label: 'PDF-Archiv', roles: NAV_ACCESS['/verwaltung/pdf-archiv'] ?? [] },
      { path: '/verwaltung/audit-log', label: 'Audit-Log', roles: NAV_ACCESS['/verwaltung/audit-log'] ?? [] },
      { path: '/verwaltung/einstellungen', label: 'Einstellungen', roles: NAV_ACCESS['/verwaltung/einstellungen'] ?? [] },
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
    if (currentUrl === group.rootPath || currentUrl.startsWith(`${group.rootPath}/`)) return group.id;
    if (group.links.some((link) => currentUrl.startsWith(link.path))) return group.id;
  }
  return 'uebersicht';
}
