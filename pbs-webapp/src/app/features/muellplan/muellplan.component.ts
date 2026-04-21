import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MuellplanFacade } from './muellplan.facade';
import { ObjektListeComponent } from './components/objekt-liste/objekt-liste.component';
import { TerminKalenderComponent } from './components/termin-kalender/termin-kalender.component';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import {
  MuellplanFormularDaten,
  TerminAnzeige,
  TerminFormularDaten,
  VorlageFormularDaten,
} from './muellplan.models';
import { datumFormatieren } from '../../core/utils/format.utils';
import { MuellplanVorlage, Objekt } from '../../core/models';

@Component({
  selector: 'app-muellplan',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ObjektListeComponent,
    TerminKalenderComponent,
    ConfirmModalComponent,
    PageTitleComponent,
  ],
  templateUrl: './muellplan.component.html',
  styleUrl: './muellplan.component.scss',
})
export class MuellplanComponent implements OnInit {
  protected readonly facade = inject(MuellplanFacade);
  protected readonly filterModalOffen = signal(false);

  protected readonly monate = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];

  ngOnInit(): void {
    this.facade.ladeDaten();
  }

  protected readonly terminAnzeige = computed((): TerminAnzeige[] => {
    const termine = this.facade.gefilterteTermine();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return termine
      .slice()
      .sort((a, b) => a.abholung.localeCompare(b.abholung))
      .map((t) => {
        const ab = new Date(t.abholung);
        ab.setHours(0, 0, 0, 0);
        const diffTage = Math.round((ab.getTime() - today.getTime()) / 86_400_000);

        const rausstellen = new Date(ab);
        rausstellen.setDate(rausstellen.getDate() - 1);

        const status: TerminAnzeige['status'] = t.erledigt
          ? 'erledigt'
          : diffTage < 0
            ? 'verpasst'
            : diffTage === 0
              ? 'heute'
              : diffTage === 1
                ? 'morgen'
                : diffTage <= 7
                  ? 'bald'
                  : 'zukunft';

        return {
          ...t,
          diffTage,
          status,
          abholungAnzeige: t.abholung,
          rausstellen: rausstellen.toISOString().slice(0, 10),
        };
      });
  });

  protected readonly naechsteTermine = computed((): TerminAnzeige[] => {
    return this.terminAnzeige()
      .filter((t) => !t.erledigt && t.diffTage >= 0)
      .slice(0, 3);
  });

  protected readonly aktiveVorlage = computed((): MuellplanVorlage | null => {
    const objekt = this.facade.aktuellesObjekt();
    if (!objekt?.vorlage_id) return null;
    return this.facade.vorlagen().find((v) => v.id === objekt.vorlage_id) ?? null;
  });

  protected readonly monatFilter = computed((): number | null => {
    const v = this.facade.terminMonatFilter();
    return v === '' ? null : v;
  });

  protected readonly hatAktivenFilter = computed((): boolean => {
    return (
      this.facade.terminMonatFilter() !== '' ||
      this.facade.vergangeneAusblenden() ||
      !!this.facade.muellartFilter()
    );
  });

  protected terminErledigtAendern(event: { id: number; erledigt: boolean }): void {
    this.facade.setTerminErledigt(event.id, event.erledigt);
  }

  protected objektLoeschenBestaetigen(objekt: Objekt): void {
    this.facade.deleteObjectBestaetigen(objekt.id);
  }

  protected terminMonatFilterGeaendert(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.facade.terminMonatFilter.set(val === '' ? '' : (parseInt(val) as number));
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

  protected fmtDatum(s: string): string {
    return datumFormatieren(s);
  }

  protected adresseFormatieren(objekt: { strasse?: string; plz?: string; ort?: string }): string {
    const teile = [objekt.strasse, [objekt.plz, objekt.ort].filter(Boolean).join(' ')].filter(
      Boolean,
    );
    return teile.join(', ');
  }
}
