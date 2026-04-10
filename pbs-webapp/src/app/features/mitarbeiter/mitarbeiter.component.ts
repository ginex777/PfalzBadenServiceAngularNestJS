import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MitarbeiterFacade } from './mitarbeiter.facade';
import { MitarbeiterListeComponent } from './components/mitarbeiter-liste/mitarbeiter-liste.component';
import { StundenErfassungComponent } from './components/stunden-erfassung/stunden-erfassung.component';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { StundenFormularDaten } from './mitarbeiter.models';

@Component({
  selector: 'app-mitarbeiter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MitarbeiterListeComponent, StundenErfassungComponent, ConfirmModalComponent, PageTitleComponent],
  templateUrl: './mitarbeiter.component.html',
  styleUrl: './mitarbeiter.component.scss',
})
export class MitarbeiterComponent implements OnInit {
  protected readonly facade = inject(MitarbeiterFacade);

  ngOnInit(): void { this.facade.ladeDaten(); }

  protected nameGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren('name', (event.target as HTMLInputElement).value);
  }
  protected rolleGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren('rolle', (event.target as HTMLInputElement).value);
  }
  protected stundenlohnGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren('stundenlohn', +((event.target as HTMLInputElement).value) || 0);
  }
  protected emailGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren('email', (event.target as HTMLInputElement).value);
  }
  protected telGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren('tel', (event.target as HTMLInputElement).value);
  }
  protected aktivGeaendert(event: Event): void {
    this.facade.formularFeldAktualisieren('aktiv', (event.target as HTMLInputElement).checked as never);
  }
  protected stundenFeldGeaendert(event: { feld: keyof StundenFormularDaten; wert: string | number }): void {
    this.facade.stundenFormularFeldAktualisieren(event.feld, event.wert as never);
  }
}
