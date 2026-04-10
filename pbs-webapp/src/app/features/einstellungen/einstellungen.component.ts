import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { EinstellungenFacade } from './einstellungen.facade';
import { FirmaFormularComponent } from './components/firma-formular/firma-formular.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { FirmaSettings } from '../../core/models';

@Component({
  selector: 'app-einstellungen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FirmaFormularComponent, PageTitleComponent],
  templateUrl: './einstellungen.component.html',
  styleUrl: './einstellungen.component.scss',
})
export class EinstellungenComponent implements OnInit {
  protected readonly facade = inject(EinstellungenFacade);

  ngOnInit(): void { this.facade.ladeDaten(); }

  protected feldAktualisieren(event: { feld: keyof FirmaSettings; wert: string }): void {
    this.facade.firmaFeldAktualisieren(event.feld, event.wert);
  }

  protected backupZeitFormatieren(zeit: string | null): string {
    if (!zeit) return 'Noch kein Backup';
    const d = new Date(zeit);
    const ago = Math.round((Date.now() - d.getTime()) / 60000);
    const agoStr = ago < 1 ? 'gerade eben' : ago < 60 ? `vor ${ago} Min.` : `vor ${Math.round(ago / 60)} Std.`;
    return `${d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} (${agoStr})`;
  }

  protected smtpFeldAktualisieren(feld: string, event: Event): void {
    const wert = (event.target as HTMLInputElement).value;
    this.facade.smtpFeldAktualisieren(feld as 'host' | 'user' | 'pass' | 'fromName', wert);
  }

  protected smtpSecureGeaendert(event: Event): void {
    this.facade.smtpFeldAktualisieren('secure', (event.target as HTMLInputElement).checked);
  }

  protected smtpPortGeaendert(event: Event): void {
    this.facade.smtpFeldAktualisieren('port', parseInt((event.target as HTMLInputElement).value, 10) || 587);
  }
}
