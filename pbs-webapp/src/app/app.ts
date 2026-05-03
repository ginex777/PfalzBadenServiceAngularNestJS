import { Component, inject } from '@angular/core';
import { ShellComponent } from './layout/shell/shell.component';
import { ThemeService } from './core/services/theme.service';
import { ConfirmHostComponent } from './shared/ui/confirm-host/confirm-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent, ConfirmHostComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Injecting here ensures ThemeService initialises and applies the saved theme
  // before the first render, preventing a flash of the wrong theme.
  protected readonly theme = inject(ThemeService);
}
