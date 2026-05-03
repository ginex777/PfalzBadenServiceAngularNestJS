import { inject } from '@angular/core';
import type { CanDeactivateFn } from '@angular/router';
import { ConfirmService } from '../../shared/services/confirm.service';

export interface HasUnsavedChanges {
  hatUngespeicherteAenderungen(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component.hatUngespeicherteAenderungen?.()) return true;
  return inject(ConfirmService).confirm({
    title: 'Ungespeicherte Änderungen',
    message: 'Es gibt ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?',
    confirmLabel: 'Verlassen',
    isDangerous: false,
  });
};
