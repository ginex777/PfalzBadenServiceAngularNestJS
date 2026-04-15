import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'buchhaltung',
    canActivate: [authGuard],
    loadComponent: () => import('./features/buchhaltung/buchhaltung.component').then(m => m.BuchhaltungComponent),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'rechnungen',
    canActivate: [authGuard],
    loadComponent: () => import('./features/rechnungen/rechnungen.component').then(m => m.RechnungenComponent),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'angebote',
    canActivate: [authGuard],
    loadComponent: () => import('./features/angebote/angebote.component').then(m => m.AngeboteComponent),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'kunden',
    canActivate: [authGuard],
    loadComponent: () => import('./features/kunden/kunden.component').then(m => m.KundenComponent),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'marketing',
    canActivate: [authGuard],
    loadComponent: () => import('./features/marketing/marketing.component').then(m => m.MarketingComponent),
  },
  {
    path: 'einstellungen',
    canActivate: [authGuard],
    loadComponent: () => import('./features/einstellungen/einstellungen.component').then(m => m.EinstellungenComponent),
  },
  {
    path: 'euer',
    canActivate: [authGuard],
    loadComponent: () => import('./features/euer/euer.component').then(m => m.EuerComponent),
  },
  {
    path: 'datev',
    canActivate: [authGuard],
    loadComponent: () => import('./features/datev/datev.component').then(m => m.DatevComponent),
  },
  {
    path: 'aufgaben',
    canActivate: [authGuard],
    loadComponent: () => import('./features/kanban/kanban.component').then(m => m.KanbanComponent),
  },
  {
    path: 'mitarbeiter',
    canActivate: [authGuard],
    loadComponent: () => import('./features/mitarbeiter/mitarbeiter.component').then(m => m.MitarbeiterComponent),
  },
  {
    path: 'muellplan',
    canActivate: [authGuard],
    loadComponent: () => import('./features/muellplan/muellplan.component').then(m => m.MuellplanComponent),
  },
  {
    path: 'hausmeister',
    canActivate: [authGuard],
    loadComponent: () => import('./features/hausmeister/hausmeister.component').then(m => m.HausmeisterComponent),
  },
  {
    path: 'pdf-archiv',
    canActivate: [authGuard],
    loadComponent: () => import('./features/pdf-archiv/pdf-archiv.component').then(m => m.PdfArchivComponent),
  },
  {
    path: 'belege',
    canActivate: [authGuard],
    loadComponent: () => import('./features/belege/belege.component').then(m => m.BelegeComponent),
  },
  {
    path: 'audit-log',
    canActivate: [authGuard],
    loadComponent: () => import('./features/audit-log/audit-log.component').then(m => m.AuditLogComponent),
  },
  {
    path: 'suche',
    canActivate: [authGuard],
    loadComponent: () => import('./features/suche/suche.component').then(m => m.SucheComponent),
  },
  {
    path: 'fixkosten',
    canActivate: [authGuard],
    loadComponent: () => import('./features/wiederkehrende-ausgaben/wiederkehrende-ausgaben.component').then(m => m.WiederkehrendeAusgabenComponent),
  },
  {
    path: 'wiederkehrende-rechnungen',
    canActivate: [authGuard],
    loadComponent: () => import('./features/wiederkehrende-rechnungen/wiederkehrende-rechnungen.component').then(m => m.WiederkehrendeRechnungenComponent),
  },
  {
    path: 'vertraege',
    canActivate: [authGuard],
    loadComponent: () => import('./features/vertraege/vertraege.component').then(m => m.VertraegeComponent),
  },
  {
    path: 'benutzerverwaltung',
    canActivate: [authGuard],
    loadComponent: () => import('./features/benutzerverwaltung/benutzerverwaltung.component').then(m => m.BenutzerverwaltungComponent),
  },
  { path: '**', redirectTo: 'login' },
];
