import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MarketingFacade } from './marketing.facade';
import { MarketingTabelleComponent } from './components/marketing-tabelle/marketing-tabelle.component';
import { MarketingFormularComponent } from './components/marketing-formular/marketing-formular.component';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { MarketingKontakt } from '../../core/models';
import { MarketingFormularDaten, MarketingStatusFilter, CsvImportZeile } from './marketing.models';

@Component({
  selector: 'app-marketing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarketingTabelleComponent, MarketingFormularComponent, ConfirmModalComponent, PageTitleComponent],
  templateUrl: './marketing.component.html',
  styleUrl: './marketing.component.scss',
})
export class MarketingComponent implements OnInit {
  protected readonly facade = inject(MarketingFacade);
  protected readonly statusModalStatus = signal<MarketingKontakt['status']>('neu');
  protected readonly statusModalNotiz = signal('');
  protected readonly csvImportSichtbar = signal(false);
  protected readonly sendModalKontakt = signal<MarketingKontakt | null>(null);
  protected readonly sendModalBetreff = signal('');
  protected readonly sendModalText = signal('');

  private readonly DEFAULT_BETREFF = 'Entlasten Sie Ihr Unternehmen – Pfalz-Baden Service';
  private readonly DEFAULT_TEXT = `Sehr geehrte Damen und Herren,

wir bieten professionelle Dienstleistungen für Unternehmen, Büros und Wohnanlagen:

- Hausmeisterservice & Objektbetreuung
- Unterhaltsreinigung
- Treppenhausreinigung
- Garten- und Außenanlagenpflege
- Winterdienst
- Mülldienst

Gerne erstellen wir Ihnen ein unverbindliches Angebot.

Mit freundlichen Grüßen
Pfalz-Baden Service GbR`;

  ngOnInit(): void { this.facade.ladeDaten(); }

  protected formularOeffnen(kontakt?: MarketingKontakt): void { this.facade.formularOeffnen(kontakt); }
  protected formularSchliessen(): void { this.facade.formularSchliessen(); }
  protected speichern(): void { this.facade.speichern(); }

  protected feldAktualisieren(event: { feld: keyof MarketingFormularDaten; wert: string }): void {
    this.facade.formularFeldAktualisieren(event.feld, event.wert as never);
  }

  protected statusModalOeffnen(kontakt: MarketingKontakt): void {
    this.statusModalStatus.set(kontakt.status);
    this.statusModalNotiz.set(kontakt.status_notiz ?? '');
    this.facade.statusModalOeffnen(kontakt);
  }

  protected statusSpeichern(): void {
    this.facade.statusSpeichern(this.statusModalStatus(), this.statusModalNotiz());
  }

  protected suchbegriffAuslesen(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected filterAendern(event: Event): void {
    this.facade.filterSetzen((event.target as HTMLSelectElement).value as MarketingStatusFilter);
  }

  protected statusModalStatusGeaendert(event: Event): void {
    this.statusModalStatus.set((event.target as HTMLSelectElement).value as MarketingKontakt['status']);
  }

  protected statusModalNotizGeaendert(event: Event): void {
    this.statusModalNotiz.set((event.target as HTMLInputElement).value);
  }

  protected filterSetzen(event: Event): void {
    this.facade.filterSetzen((event.target as HTMLSelectElement).value as MarketingStatusFilter);
  }

  protected suchbegriffGeaendert(event: Event): void {
    this.facade.suchbegriffAktualisieren((event.target as HTMLInputElement).value);
  }

  protected vorlageBetrefGeaendert(event: Event): void {
    this.facade.vorlageBetreff.set((event.target as HTMLInputElement).value);
  }

  protected vorlageTextGeaendert(event: Event): void {
    this.facade.vorlageText.set((event.target as HTMLTextAreaElement).value);
  }

  protected vorlageSpeichern(): void {
    this.facade.vorlageSpeichern();
  }

  protected senden(kontakt: MarketingKontakt): void {
    const betreff = this.facade.vorlageBetreff() || this.DEFAULT_BETREFF;
    const templateText = this.facade.vorlageText() || this.DEFAULT_TEXT;
    const text = templateText
      .replace(/\{name\}/g, kontakt.name)
      .replace(/\{person\}/g, kontakt.person || kontakt.name);
    this.sendModalKontakt.set(kontakt);
    this.sendModalBetreff.set(betreff);
    this.sendModalText.set(text);
  }

  protected sendModalSchliessen(): void {
    this.sendModalKontakt.set(null);
  }

  protected outlookOeffnen(): void {
    const k = this.sendModalKontakt();
    if (!k) return;
    const url = `https://outlook.office365.com/mail/deeplink/compose?to=${encodeURIComponent(k.email)}&subject=${encodeURIComponent(this.sendModalBetreff())}&body=${encodeURIComponent(this.sendModalText())}`;
    window.open(url, '_blank');
    // Mark as gesendet
    this.facade.statusSpeichern('gesendet', k.status_notiz ?? '');
    this.sendModalSchliessen();
  }

  protected textKopieren(): void {
    navigator.clipboard.writeText(this.sendModalText()).catch(() => {});
  }

  protected csvDateiEinlesen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const datei = input.files?.[0];
    if (!datei) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target as FileReader).result as string;
      const zeilen = this.csvParsen(text);
      const vorhandeneEmails = new Set(this.facade.kontakte().map(k => k.email.toLowerCase()));
      const vorschau: CsvImportZeile[] = zeilen.map(z => ({
        ...z, istDuplikat: !!z.email && vorhandeneEmails.has(z.email.toLowerCase()),
      }));
      this.facade.csvImportVorschauZeigen(vorschau);
    };
    reader.readAsText(datei, 'UTF-8');
    input.value = '';
  }

  private csvParsen(text: string): Omit<CsvImportZeile, 'istDuplikat'>[] {
    const zeilen = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
    if (zeilen.length < 2) return [];
    const trennzeichen = zeilen[0].includes(';') ? ';' : ',';
    const kopfzeile = this.csvZeileSpalten(zeilen[0], trennzeichen).map(h =>
      h.toLowerCase().trim()
        .replace(/firma|company|unternehmen/, 'name')
        .replace(/ansprechpartner|kontakt|contact/, 'person')
        .replace(/telefon|phone|tel\./, 'tel')
        .replace(/e-?mail/, 'email')
        .replace(/stra[s]e|street|adresse/, 'strasse')
        .replace(/plz.*ort|ort|city|stadt/, 'ort')
        .replace(/branche|notiz|note|bemerkung/, 'notiz')
    );
    return zeilen.slice(1).filter(l => l.trim()).map(l => {
      const werte = this.csvZeileSpalten(l, trennzeichen);
      const obj: Record<string, string> = {};
      kopfzeile.forEach((h, i) => { obj[h] = (werte[i] ?? '').trim(); });
      return { name: obj['name'] ?? '', email: obj['email'] ?? '', person: obj['person'] ?? '',
        tel: obj['tel'] ?? '', strasse: obj['strasse'] ?? '', ort: obj['ort'] ?? '', notiz: obj['notiz'] ?? '' };
    }).filter(z => z.name);
  }

  private csvZeileSpalten(zeile: string, trennzeichen: string): string[] {
    const ergebnis: string[] = [];
    let aktuell = '', inAnfuehrung = false;
    for (let i = 0; i < zeile.length; i++) {
      const z = zeile[i];
      if (z === '"') { if (inAnfuehrung && zeile[i + 1] === '"') { aktuell += '"'; i++; } else inAnfuehrung = !inAnfuehrung; }
      else if (z === trennzeichen && !inAnfuehrung) { ergebnis.push(aktuell); aktuell = ''; }
      else aktuell += z;
    }
    ergebnis.push(aktuell);
    return ergebnis;
  }
}
