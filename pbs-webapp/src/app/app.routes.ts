import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'uebersicht', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'uebersicht',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
    ],
  },
  {
    path: 'operativ',
    canActivate: [authGuard, roleGuard(['admin', 'readonly', 'mitarbeiter'])],
    loadComponent: () =>
      import('./features/operativ/operativ-shell.component').then((m) => m.OperativShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/operativ/operativ-landing.component').then((m) => m.OperativLandingComponent),
      },
      {
        path: 'muellplan',
        canActivate: [roleGuard(['admin', 'mitarbeiter'])],
        loadComponent: () =>
          import('./features/muellplan/muellplan.component').then((m) => m.MuellplanComponent),
      },
      {
        path: 'hausmeister',
        canActivate: [roleGuard(['admin', 'mitarbeiter'])],
        loadComponent: () =>
          import('./features/hausmeister/hausmeister.component').then((m) => m.HausmeisterComponent),
      },
      {
        path: 'nachweise',
        loadComponent: () =>
          import('./features/nachweise/nachweise.component').then((m) => m.NachweiseComponent),
      },
      {
        path: 'checklisten',
        loadComponent: () =>
          import('./features/checklisten/checklisten.component').then((m) => m.ChecklistenComponent),
      },
      {
        path: 'stempeluhr',
        canActivate: [roleGuard(['admin', 'mitarbeiter'])],
        loadComponent: () =>
          import('./features/stempeluhr/stempeluhr.component').then((m) => m.StempeluhrComponent),
      },
      {
        path: 'foto-upload',
        canActivate: [roleGuard(['admin', 'mitarbeiter'])],
        loadComponent: () =>
          import('./features/foto-upload/foto-upload.component').then((m) => m.FotoUploadComponent),
      },
      {
        path: 'mobile-rueckmeldungen',
        loadComponent: () =>
          import('./features/mobile-rueckmeldungen/mobile-rueckmeldungen.component').then(
            (m) => m.MobileRueckmeldungenComponent,
          ),
      },
      {
        path: 'aufgaben',
        canActivate: [roleGuard(['admin', 'readonly'])],
        loadComponent: () =>
          import('./features/aufgaben/aufgaben.component').then((m) => m.AufgabenComponent),
      },
    ],
  },
  {
    path: 'finanzen',
    canActivate: [authGuard, roleGuard(['admin', 'readonly'])],
    children: [
      { path: '', redirectTo: 'rechnungen', pathMatch: 'full' },
      {
        path: 'rechnungen',
        loadComponent: () =>
          import('./features/rechnungen/rechnungen.component').then((m) => m.RechnungenComponent),
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'angebote',
        loadComponent: () =>
          import('./features/angebote/angebote.component').then((m) => m.AngeboteComponent),
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'buchhaltung',
        loadComponent: () =>
          import('./features/buchhaltung/buchhaltung-shell.component').then(
            (m) => m.BuchhaltungShellComponent,
          ),
        children: [
          { path: '', redirectTo: 'uebersicht', pathMatch: 'full' },
          {
            path: 'uebersicht',
            loadComponent: () =>
              import('./features/buchhaltung/buchhaltung.component').then(
                (m) => m.BuchhaltungComponent,
              ),
            canDeactivate: [unsavedChangesGuard],
          },
          {
            path: 'fixkosten',
            loadComponent: () =>
              import('./features/wiederkehrende-ausgaben/wiederkehrende-ausgaben.component').then(
                (m) => m.WiederkehrendeAusgabenComponent,
              ),
          },
          {
            path: 'wiederkehrende-rechnungen',
            loadComponent: () =>
              import(
                './features/wiederkehrende-rechnungen/wiederkehrende-rechnungen.component'
              ).then((m) => m.WiederkehrendeRechnungenComponent),
          },
          {
            path: 'datev',
            loadComponent: () =>
              import('./features/datev/datev.component').then((m) => m.DatevComponent),
          },
          {
            path: 'euer',
            loadComponent: () =>
              import('./features/euer/euer.component').then((m) => m.EuerComponent),
          },
          {
            path: 'belege',
            loadComponent: () =>
              import('./features/belege/belege.component').then((m) => m.BelegeComponent),
          },
        ],
      },
      // Legacy sibling routes → redirect into buchhaltung shell
      { path: 'wiederkehrende-rechnungen', redirectTo: 'buchhaltung/wiederkehrende-rechnungen', pathMatch: 'full' },
      { path: 'belege', redirectTo: 'buchhaltung/belege', pathMatch: 'full' },
      { path: 'euer', redirectTo: 'buchhaltung/euer', pathMatch: 'full' },
      { path: 'fixkosten', redirectTo: 'buchhaltung/fixkosten', pathMatch: 'full' },
      { path: 'datev', redirectTo: 'buchhaltung/datev', pathMatch: 'full' },
    ],
  },
  {
    path: 'verwaltung',
    canActivate: [authGuard, roleGuard(['admin', 'readonly'])],
    children: [
      { path: '', redirectTo: 'kunden', pathMatch: 'full' },
      {
        path: 'objekte',
        loadComponent: () =>
          import('./features/objekte/objekte-liste.component').then((m) => m.ObjekteListeComponent),
      },
      {
        path: 'objekte/:id',
        loadComponent: () =>
          import('./features/objekte/objekt-detail.component').then((m) => m.ObjektDetailComponent),
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'kunden',
        loadComponent: () =>
          import('./features/kunden/kunden.component').then((m) => m.KundenComponent),
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'mitarbeiter',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/mitarbeiter/mitarbeiter.component').then((m) => m.MitarbeiterComponent),
      },
      {
        path: 'vertraege',
        loadComponent: () =>
          import('./features/vertraege/vertraege.component').then((m) => m.VertraegeComponent),
      },
      {
        path: 'pdf-archiv',
        loadComponent: () =>
          import('./features/pdf-archiv/pdf-archiv.component').then((m) => m.PdfArchivComponent),
      },
      {
        path: 'audit-log',
        loadComponent: () =>
          import('./features/audit-log/audit-log.component').then((m) => m.AuditLogComponent),
      },
      {
        path: 'einstellungen',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./features/einstellungen/einstellungen.component').then(
            (m) => m.EinstellungenComponent,
          ),
      },
    ],
  },
  {
    path: 'benutzer',
    canActivate: [authGuard, roleGuard(['admin'])],
    children: [
      { path: '', redirectTo: 'verwaltung', pathMatch: 'full' },
      {
        path: 'verwaltung',
        loadComponent: () =>
          import('./features/benutzerverwaltung/benutzerverwaltung.component').then(
            (m) => m.BenutzerverwaltungComponent,
          ),
      },
    ],
  },

  // Compatibility redirects (old URLs)
  { path: 'dashboard', redirectTo: 'uebersicht', pathMatch: 'full' },
  { path: 'suche', redirectTo: 'uebersicht', pathMatch: 'full' },

  { path: 'rechnungen', redirectTo: 'finanzen/rechnungen', pathMatch: 'full' },
  { path: 'angebote', redirectTo: 'finanzen/angebote', pathMatch: 'full' },
  { path: 'wiederkehrende-rechnungen', redirectTo: 'finanzen/wiederkehrende-rechnungen', pathMatch: 'full' },
  { path: 'buchhaltung', redirectTo: 'finanzen/buchhaltung', pathMatch: 'full' },
  { path: 'belege', redirectTo: 'finanzen/belege', pathMatch: 'full' },
  { path: 'euer', redirectTo: 'finanzen/euer', pathMatch: 'full' },
  { path: 'fixkosten', redirectTo: 'finanzen/fixkosten', pathMatch: 'full' },
  { path: 'datev', redirectTo: 'finanzen/datev', pathMatch: 'full' },

  { path: 'kunden', redirectTo: 'verwaltung/kunden', pathMatch: 'full' },
  { path: 'mitarbeiter', redirectTo: 'verwaltung/mitarbeiter', pathMatch: 'full' },
  { path: 'vertraege', redirectTo: 'verwaltung/vertraege', pathMatch: 'full' },
  { path: 'pdf-archiv', redirectTo: 'verwaltung/pdf-archiv', pathMatch: 'full' },
  { path: 'audit-log', redirectTo: 'verwaltung/audit-log', pathMatch: 'full' },
  { path: 'einstellungen', redirectTo: 'verwaltung/einstellungen', pathMatch: 'full' },
  { path: 'benutzerverwaltung', redirectTo: 'benutzer/verwaltung', pathMatch: 'full' },

  { path: 'muellplan', redirectTo: 'operativ/muellplan', pathMatch: 'full' },
  { path: 'hausmeister', redirectTo: 'operativ/hausmeister', pathMatch: 'full' },
  { path: 'nachweise', redirectTo: 'operativ/nachweise', pathMatch: 'full' },
  { path: 'checklisten', redirectTo: 'operativ/checklisten', pathMatch: 'full' },
  { path: 'stempeluhr', redirectTo: 'operativ/stempeluhr', pathMatch: 'full' },
  { path: 'foto-upload', redirectTo: 'operativ/foto-upload', pathMatch: 'full' },
  { path: 'mobile-rueckmeldungen', redirectTo: 'operativ/mobile-rueckmeldungen', pathMatch: 'full' },

  { path: 'marketing', redirectTo: 'uebersicht', pathMatch: 'full' },
  { path: 'aufgaben', redirectTo: 'uebersicht', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
