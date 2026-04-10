import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavEintrag {
  path: string;
  label: string;
  section?: string;
}

const NAV_EINTRAEGE: NavEintrag[] = [
  { path: '/dashboard',                  label: 'Dashboard',            section: 'Übersicht' },
  { path: '/buchhaltung',                label: 'Buchhaltung',          section: 'Buchhaltung' },
  { path: '/euer',                       label: 'EÜR' },
  { path: '/datev',                      label: 'DATEV Export' },
  { path: '/fixkosten',                  label: 'Fixkosten' },
  { path: '/wiederkehrende-rechnungen',  label: 'Wiederk. Rechnungen' },
  { path: '/rechnungen',                 label: 'Rechnungen',           section: 'Dokumente' },
  { path: '/angebote',                   label: 'Angebote' },
  { path: '/kunden',                     label: 'Kunden',               section: 'Kunden & Team' },
  { path: '/mitarbeiter',                label: 'Mitarbeiter' },
  { path: '/muellplan',                  label: 'Müllplan',             section: 'Operativ' },
  { path: '/hausmeister',                label: 'Hausmeisterdienste' },
  { path: '/marketing',                  label: 'Marketing',            section: 'Verwaltung' },
  { path: '/aufgaben',                   label: 'Aufgaben' },
  { path: '/pdf-archiv',                 label: 'PDF Archiv',           section: 'Archiv' },
  { path: '/belege',                     label: 'Beleg-Archiv' },
  { path: '/audit-log',                  label: 'Audit-Log' },
  { path: '/einstellungen',              label: 'Einstellungen',        section: 'System' },
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

  protected readonly navEintraege = NAV_EINTRAEGE;

  protected navigiertZu(): void {
    this.geschlossen.emit();
  }
}
