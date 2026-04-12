import {
  ChangeDetectionStrategy, Component, inject, input, output, signal, computed,
} from '@angular/core';
import { NutzerService } from '../../core/services/nutzer.service';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const NAV_GRUPPEN: NavGroup[] = [
  {
    id: 'uebersicht',
    label: 'Übersicht',
    items: [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/suche',     label: 'Suche'     },
    ],
  },
  {
    id: 'verkauf',
    label: 'Verkauf',
    items: [
      { path: '/kunden',                    label: 'Kunden'              },
      { path: '/rechnungen',                label: 'Rechnungen'          },
      { path: '/angebote',                  label: 'Angebote'            },
      { path: '/wiederkehrende-rechnungen', label: 'Wiederk. Rechnungen' },
      { path: '/marketing',                 label: 'Marketing'           },
    ],
  },
  {
    id: 'finanzen',
    label: 'Finanzen',
    items: [
      { path: '/buchhaltung', label: 'Buchhaltung' },
      { path: '/belege',      label: 'Belege'       },
      { path: '/euer',        label: 'EÜR'          },
      { path: '/fixkosten',   label: 'Fixkosten'    },
      { path: '/datev',       label: 'DATEV Export' },
    ],
  },
  {
    id: 'betrieb',
    label: 'Betrieb',
    items: [
      { path: '/muellplan',   label: 'Müllplan'    },
      { path: '/hausmeister', label: 'Hausmeister' },
      { path: '/aufgaben',    label: 'Aufgaben'    },
    ],
  },
  {
    id: 'verwaltung',
    label: 'Verwaltung',
    items: [
      { path: '/mitarbeiter',   label: 'Mitarbeiter'  },
      { path: '/vertraege',     label: 'Verträge'     },
      { path: '/pdf-archiv',    label: 'PDF Archiv'   },
      { path: '/audit-log',     label: 'Audit-Log'    },
      { path: '/einstellungen', label: 'Einstellungen'},
    ],
  },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly geschlossen = output<void>();
  readonly notifAnzahl = input(0);
  readonly darkMode = input(false);
  readonly darkModeGeaendert = output<void>();
  readonly nutzerWechselnGeklickt = output<void>();

  protected readonly navGruppen = NAV_GRUPPEN;
  protected readonly nutzerService = inject(NutzerService);
  private readonly router = inject(Router);

  /** Which group is currently open */
  protected readonly offeneGruppe = signal<string>(this._initialGroup());

  protected toggleGruppe(id: string): void {
    this.offeneGruppe.set(this.offeneGruppe() === id ? '' : id);
  }

  protected istOffen(id: string): boolean {
    return this.offeneGruppe() === id;
  }

  protected navigiertZu(): void {
    this.geschlossen.emit();
  }

  private _initialGroup(): string {
    const url = this.router.url;
    for (const g of NAV_GRUPPEN) {
      if (g.items.some(i => url.startsWith(i.path))) return g.id;
    }
    return 'uebersicht';
  }
}
