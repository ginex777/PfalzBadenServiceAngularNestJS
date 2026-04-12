import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedChanges {
  hatUngespeicherteAenderungen(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (component.hatUngespeicherteAenderungen?.()) {
    return confirm('Es gibt ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?');
  }
  return true;
};
