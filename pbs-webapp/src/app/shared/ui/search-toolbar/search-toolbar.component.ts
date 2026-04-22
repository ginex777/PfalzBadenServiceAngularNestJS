import { ChangeDetectionStrategy, Component, input, output, model } from '@angular/core';
import { RoleAllowedDirective } from '../../../core/directives/role-allowed.directive';

type UserRole = 'admin' | 'readonly' | 'mitarbeiter';

@Component({
  selector: 'app-search-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RoleAllowedDirective],
  templateUrl: './search-toolbar.component.html',
  styleUrl: './search-toolbar.component.scss',
})
export class SearchToolbarComponent {
  readonly placeholder = input<string>('Suchen…');
  readonly actionLabel = input<string>('');
  readonly actionDisabled = input<boolean>(false);
  readonly actionRoles = input<readonly UserRole[] | null>(null);
  readonly searchTerm = model<string>('');
  readonly action = output<void>();

  protected onInputChanged(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected triggerAction(): void {
    this.action.emit();
  }
}
