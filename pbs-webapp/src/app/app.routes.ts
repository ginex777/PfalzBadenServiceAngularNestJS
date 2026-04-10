import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'buchhaltung',
    loadComponent: () => import('./features/buchhaltung/buchhaltung.component').then(m => m.BuchhaltungComponent),
  },
  {
    path: 'rechnungen',
    loadComponent: () => import('./features/rechnungen/rechnungen.component').then(m => m.RechnungenComponent),
  },
  {
    path: 'angebote',
    loadComponent: () => import('./features/angebote/angebote.component').then(m => m.AngeboteComponent),
  },
  {
    path: 'kunden',
    loadComponent: () => import('./features/kunden/kunden.component').then(m => m.KundenComponent),
  },
  {
    path: 'marketing',
    loadComponent: () => import('./features/marketing/marketing.component').then(m => m.MarketingComponent),
  },
  {
    path: 'einstellungen',
    loadComponent: () => import('./features/einstellungen/einstellungen.component').then(m => m.EinstellungenComponent),
  },
  {
    path: 'euer',
    loadComponent: () => import('./features/euer/euer.component').then(m => m.EuerComponent),
  },
  {
    path: 'datev',
    loadComponent: () => import('./features/datev/datev.component').then(m => m.DatevComponent),
  },
  {
    path: 'aufgaben',
    loadComponent: () => import('./features/kanban/kanban.component').then(m => m.KanbanComponent),
  },
  {
    path: 'mitarbeiter',
    loadComponent: () => import('./features/mitarbeiter/mitarbeiter.component').then(m => m.MitarbeiterComponent),
  },
  {
    path: 'muellplan',
    loadComponent: () => import('./features/muellplan/muellplan.component').then(m => m.MuellplanComponent),
  },
  {
    path: 'hausmeister',
    loadComponent: () => import('./features/hausmeister/hausmeister.component').then(m => m.HausmeisterComponent),
  },
  {
    path: 'pdf-archiv',
    loadComponent: () => import('./features/pdf-archiv/pdf-archiv.component').then(m => m.PdfArchivComponent),
  },
  {
    path: 'belege',
    loadComponent: () => import('./features/belege/belege.component').then(m => m.BelegeComponent),
  },
  {
    path: 'audit-log',
    loadComponent: () => import('./features/audit-log/audit-log.component').then(m => m.AuditLogComponent),
  },
  {
    path: 'suche',
    loadComponent: () => import('./features/suche/suche.component').then(m => m.SucheComponent),
  },
  {
    path: 'fixkosten',
    loadComponent: () => import('./features/wiederkehrende-ausgaben/wiederkehrende-ausgaben.component').then(m => m.WiederkehrendeAusgabenComponent),
  },
  {
    path: 'wiederkehrende-rechnungen',
    loadComponent: () => import('./features/wiederkehrende-rechnungen/wiederkehrende-rechnungen.component').then(m => m.WiederkehrendeRechnungenComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
