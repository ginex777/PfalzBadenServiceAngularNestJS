import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { AuthService } from '../services/auth.service';

type UserRole = 'admin' | 'readonly' | 'mitarbeiter';

@Directive({
  selector: '[roleAllowed]',
  standalone: true,
})
export class RoleAllowedDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  readonly roleAllowed = input<readonly UserRole[] | null>(null);

  private hasView = false;

  constructor() {
    effect(() => {
      const allowed = this.roleAllowed();
      if (!allowed || allowed.length === 0) {
        this.render();
        return;
      }

      const role = this.auth.currentUser()?.rolle ?? null;
      if (role && allowed.includes(role)) {
        this.render();
        return;
      }
      this.clear();
    });
  }

  private render(): void {
    if (this.hasView) return;
    this.viewContainerRef.createEmbeddedView(this.templateRef);
    this.hasView = true;
  }

  private clear(): void {
    if (!this.hasView) return;
    this.viewContainerRef.clear();
    this.hasView = false;
  }
}

