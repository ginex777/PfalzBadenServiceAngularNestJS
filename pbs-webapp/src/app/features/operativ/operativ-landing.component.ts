import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type OperativRole = 'admin' | 'readonly' | 'mitarbeiter';

interface OperativTile {
  path: string;
  label: string;
  description: string;
  roles: readonly OperativRole[];
}

const TILES: readonly OperativTile[] = [
  {
    path: 'nachweise',
    label: 'Nachweise',
    description: 'Tätigkeitsnachweise erfassen',
    roles: ['admin', 'readonly', 'mitarbeiter'],
  },
  {
    path: 'checklisten',
    label: 'Checklisten',
    description: 'Kontrollen & Protokolle',
    roles: ['admin', 'readonly', 'mitarbeiter'],
  },
  {
    path: 'mobile-rueckmeldungen',
    label: 'Mobile Rückmeldungen',
    description: 'Rückmeldungen aus der App',
    roles: ['admin', 'readonly', 'mitarbeiter'],
  },
  {
    path: 'muellplan',
    label: 'Müllplan',
    description: 'Entsorgungsdienste planen',
    roles: ['admin', 'mitarbeiter'],
  },
  {
    path: 'hausmeister',
    label: 'Sonstige Tätigkeiten',
    description: 'Einsätze & Hausmeisterdienste',
    roles: ['admin', 'mitarbeiter'],
  },
  {
    path: 'stempeluhr',
    label: 'Stempeluhr',
    description: 'Arbeitszeiten erfassen',
    roles: ['admin', 'mitarbeiter'],
  },
  {
    path: 'foto-upload',
    label: 'Foto Upload',
    description: 'Fotodokumentation',
    roles: ['admin', 'mitarbeiter'],
  },
];

@Component({
  selector: 'app-operativ-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="landing-wrap">
      <h1 class="landing-title">Operativ</h1>
      <div class="tile-grid">
        @for (tile of visibleTiles(); track tile.path) {
          <a [routerLink]="tile.path" class="tile">
            <span class="tile-label">{{ tile.label }}</span>
            <span class="tile-desc">{{ tile.description }}</span>
          </a>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .landing-wrap {
        padding: 2rem 1.5rem;
      }
      .landing-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text);
        margin: 0 0 1.5rem;
      }
      .tile-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }
      .tile {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        padding: 1.25rem 1rem;
        background: var(--surface);
        border: 1px solid var(--border-strong);
        border-radius: 0.5rem;
        text-decoration: none;
        transition:
          border-color 0.15s,
          box-shadow 0.15s;
      }
      .tile:hover {
        border-color: var(--primary-solid);
        box-shadow: 0 0 0 1px var(--primary-solid);
      }
      .tile-label {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text);
      }
      .tile-desc {
        font-size: 0.8125rem;
        color: var(--gray-400);
      }
    `,
  ],
})
export class OperativLandingComponent {
  private readonly auth = inject(AuthService);

  protected readonly visibleTiles = computed(() => {
    const role = this.auth.currentUser()?.rolle ?? null;
    if (!role) return [];
    return TILES.filter((t) => (t.roles as readonly string[]).includes(role));
  });
}
