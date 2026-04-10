import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MuellplanFacade } from './muellplan.facade';
import { ObjektListeComponent } from './components/objekt-liste/objekt-liste.component';
import { TerminListeComponent } from './components/termin-liste/termin-liste.component';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { MuellplanFormularDaten, TerminFormularDaten, VorlageFormularDaten } from './muellplan.models';
import { datumFormatieren } from '../../core/utils/format.utils';

@Component({
  selector: 'app-muellplan',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ObjektListeComponent, TerminListeComponent, ConfirmModalComponent, PageTitleComponent],
  templateUrl: './muellplan.component.html',
  styleUrl: './muellplan.component.scss',
})
export class MuellplanComponent implements OnInit {
  protected readonly facade = inject(MuellplanFacade);

  protected readonly monate = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

  ngOnInit(): void { this.facade.ladeDaten(); }

  protected terminMonatFilterGeaendert(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.facade.terminMonatFilter.set(val === '' ? '' : parseInt(val) as number);
  }

  protected objektFeldGeaendert(feld: keyof MuellplanFormularDaten, event: Event): void {
    const el = event.target as HTMLInputElement | HTMLSelectElement;
    const wert = feld === 'kunden_id' ? (el.value ? parseInt(el.value) : null) : el.value;
    this.facade.objektFormularFeldAktualisieren(feld, wert as never);
  }

  protected terminFeldGeaendert(feld: keyof TerminFormularDaten, event: Event): void {
    const wert = (event.target as HTMLInputElement).value;
    this.facade.terminFormularFeldAktualisieren(feld, wert);
  }

  protected vorlageFeldGeaendert(feld: keyof VorlageFormularDaten, event: Event): void {
    const el = event.target as HTMLInputElement | HTMLTextAreaElement;
    const wert = feld === 'jahr' ? parseInt(el.value) : el.value;
    this.facade.vorlageFormularFeldAktualisieren(feld, wert as never);
  }

  protected vorlagePdfHochladen(vorlageId: number, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.facade.vorlagePdfHochladen(vorlageId, file);
  }

  protected fmtDatum(s: string): string { return datumFormatieren(s); }

  protected adresseFormatieren(objekt: { strasse?: string; plz?: string; ort?: string }): string {
    const teile = [objekt.strasse, [objekt.plz, objekt.ort].filter(Boolean).join(' ')].filter(Boolean);
    return teile.join(', ');
  }
}
