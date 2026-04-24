import { ActivatedRouteSnapshot, RouterStateSnapshot, Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MobileAuthService } from './core/auth.service';
import { ObjectContextService } from './core/object-context.service';

const authGuard = () => {
  const auth = inject(MobileAuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/login']);
};

const guestGuard = () => {
  const auth = inject(MobileAuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  return router.createUrlTree(['/tabs/heute']);
};

const roleGuard = (allowedRoles: readonly string[]) => {
  return () => {
    const auth = inject(MobileAuthService);
    const router = inject(Router);
    const role = auth.currentUser()?.rolle;
    if (!role) return router.createUrlTree(['/login']);
    if (allowedRoles.includes(role)) return true;
    return router.createUrlTree(['/tabs/heute']);
  };
};

const objectContextGuard = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const context = inject(ObjectContextService);
  const router = inject(Router);
  if (context.selectedObjectId() != null) return true;
  return router.createUrlTree(['/objekt-auswahl'], { queryParams: { returnUrl: state.url } });
};

export const routes: Routes = [
  { path: '', redirectTo: 'tabs/heute', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'objekt-auswahl',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/objekt-auswahl/objekt-auswahl.page').then((m) => m.ObjektAuswahlPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    canActivateChild: [objectContextGuard],
    loadComponent: () => import('./shell/mobile-shell.component').then((m) => m.MobileShellComponent),
    children: [
      { path: '', redirectTo: 'heute', pathMatch: 'full' },
      {
        path: 'heute',
        loadComponent: () =>
          import('./pages/tagesuebersicht/tagesuebersicht.page').then((m) => m.TagesuebersichtPage),
      },
      {
        path: 'muellplan',
        loadComponent: () => import('./pages/muellplan/muellplan.page').then((m) => m.MuellplanPage),
      },
      {
        path: 'stempeluhr',
        canActivate: [roleGuard(['admin', 'mitarbeiter'])],
        loadComponent: () => import('./pages/stempeluhr/stempeluhr.page').then((m) => m.StempeluhrPage),
      },
      {
        path: 'foto-upload',
        canActivate: [roleGuard(['admin', 'mitarbeiter'])],
        loadComponent: () => import('./pages/foto-upload/foto-upload.page').then((m) => m.FotoUploadPage),
      },
      {
        path: 'checklisten',
        canActivate: [roleGuard(['admin', 'mitarbeiter'])],
        loadComponent: () =>
          import('./pages/checklisten/checklisten.page').then((m) => m.ChecklistenPage),
      },
    ],
  },
  { path: 'stempeluhr', redirectTo: 'tabs/stempeluhr', pathMatch: 'full' },
  { path: 'tagesuebersicht', redirectTo: 'tabs/heute', pathMatch: 'full' },
  { path: 'muellplan', redirectTo: 'tabs/muellplan', pathMatch: 'full' },
  { path: 'foto-upload', redirectTo: 'tabs/foto-upload', pathMatch: 'full' },
  { path: 'checklisten', redirectTo: 'tabs/checklisten', pathMatch: 'full' },
  { path: '**', redirectTo: 'tabs/heute' },
];
