import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-buchhaltung-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="buchhaltung-subnav">
      <a routerLink="uebersicht" routerLinkActive="active">Buchhaltung</a>
      <a routerLink="fixkosten" routerLinkActive="active">Fixkosten</a>
      <a routerLink="wiederkehrende-rechnungen" routerLinkActive="active">Wiederk. Rechnungen</a>
      <a routerLink="datev" routerLinkActive="active">DATEV Export</a>
      <a routerLink="euer" routerLinkActive="active">EÜR</a>
      <a routerLink="belege" routerLinkActive="active">Belege</a>
    </nav>
    <router-outlet />
  `,
  styles: [`
    .buchhaltung-subnav {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border-strong);
      padding: 0 1.5rem;
      background: var(--surface);
    }
    .buchhaltung-subnav a {
      padding: 0.625rem 1.125rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--gray-400);
      text-decoration: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: color 0.15s, border-color 0.15s;
    }
    .buchhaltung-subnav a:hover {
      color: var(--gray-600);
    }
    .buchhaltung-subnav a.active {
      color: var(--primary-solid);
      border-bottom-color: var(--primary-solid);
    }
  `],
})
export class BuchhaltungShellComponent {}
