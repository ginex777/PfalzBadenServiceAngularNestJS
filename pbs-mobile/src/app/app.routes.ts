import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MobileAuthService } from './core/auth.service';

const authGuard = () => {
  const auth = inject(MobileAuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/login']);
};

export const routes: Routes = [
  { path: '', redirectTo: 'stempeluhr', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'stempeluhr',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/stempeluhr/stempeluhr.page').then(m => m.StempeluhrPage),
  },
  {
    path: 'tagesuebersicht',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tagesuebersicht/tagesuebersicht.page').then(m => m.TagesuebersichtPage),
  },
  {
    path: 'foto-upload',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/foto-upload/foto-upload.page').then(m => m.FotoUploadPage),
  },
  { path: '**', redirectTo: 'stempeluhr' },
];
