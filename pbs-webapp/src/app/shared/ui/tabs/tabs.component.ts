import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface AppTab {
  readonly id: string;
  readonly label: string;
  readonly badge?: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class TabsComponent {
  readonly tabs = input<readonly AppTab[]>([]);
  readonly activeId = input.required<string>();

  readonly activeIdChange = output<string>();

  protected select(id: string): void {
    this.activeIdChange.emit(id);
  }
}
