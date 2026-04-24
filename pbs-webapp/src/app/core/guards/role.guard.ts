import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export type UserRole = 'admin' | 'readonly' | 'mitarbeiter';

export const roleGuard = (allowedRoles: readonly UserRole[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.currentUser();
    if (!user) return router.createUrlTree(['/login']);

    if (allowedRoles.includes(user.rolle)) return true;
    return router.createUrlTree(['/uebersicht']);
  };
};
