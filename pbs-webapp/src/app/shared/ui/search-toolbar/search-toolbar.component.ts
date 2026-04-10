import { ChangeDetectionStrategy, Component, input, output, model } from '@angular/core';

@Component({
  selector: 'app-search-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './search-toolbar.component.html',
  styleUrl: './search-toolbar.component.scss',
})
export class SearchToolbarComponent {
  readonly platzhalter = input<string>('Suchen…');
  readonly aktionLabel = input<string>('');
  readonly aktionDeaktiviert = input<boolean>(false);
  readonly suchbegriff = model<string>('');
  readonly aktion = output<void>();

  protected eingabeGeaendert(event: Event): void {
    this.suchbegriff.set((event.target as HTMLInputElement).value);
  }

  protected aktionAusfuehren(): void {
    this.aktion.emit();
  }
}
