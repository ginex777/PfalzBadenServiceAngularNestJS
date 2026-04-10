import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';

export type StatusBadgeTyp =
  | 'bezahlt' | 'offen' | 'ueberfaellig'
  | 'angenommen' | 'abgelehnt' | 'gesendet' | 'entwurf'
  | 'aktiv' | 'inaktiv'
  | 'neu' | 'interesse' | 'kein-interesse' | 'angebot'
  | 'todo' | 'inprogress' | 'done' | 'blocked'
  | 'hoch' | 'mittel' | 'niedrig';

interface BadgeKonfiguration {
  label: string;
  klasse: string;
}

const BADGE_KONFIGURATIONEN: Record<StatusBadgeTyp, BadgeKonfiguration> = {
  bezahlt:        { label: 'Bezahlt',        klasse: 'success' },
  offen:          { label: 'Offen',          klasse: 'warning' },
  ueberfaellig:   { label: 'Überfällig',     klasse: 'danger' },
  angenommen:     { label: 'Angenommen',     klasse: 'success' },
  abgelehnt:      { label: 'Abgelehnt',      klasse: 'danger' },
  gesendet:       { label: 'Gesendet',       klasse: 'primary' },
  entwurf:        { label: 'Entwurf',        klasse: 'neutral' },
  aktiv:          { label: 'Aktiv',          klasse: 'success' },
  inaktiv:        { label: 'Inaktiv',        klasse: 'neutral' },
  neu:            { label: 'Neu',            klasse: 'neutral' },
  interesse:      { label: 'Interesse',      klasse: 'primary' },
  'kein-interesse': { label: 'Kein Interesse', klasse: 'danger' },
  angebot:        { label: 'Angebot',        klasse: 'warning' },
  todo:           { label: 'Offen',          klasse: 'neutral' },
  inprogress:     { label: 'In Arbeit',      klasse: 'primary' },
  done:           { label: 'Erledigt',       klasse: 'success' },
  blocked:        { label: 'Blockiert',      klasse: 'danger' },
  hoch:           { label: 'Hoch',           klasse: 'danger' },
  mittel:         { label: 'Mittel',         klasse: 'warning' },
  niedrig:        { label: 'Niedrig',        klasse: 'neutral' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  readonly status = input.required<StatusBadgeTyp>();
  readonly benutzerdefiniert = input<string>('');

  protected readonly konfiguration = computed<BadgeKonfiguration>(() => {
    return BADGE_KONFIGURATIONEN[this.status()] ?? { label: this.status(), klasse: 'neutral' };
  });

  protected readonly anzeigeLabel = computed<string>(() => {
    return this.benutzerdefiniert() || this.konfiguration().label;
  });
}
