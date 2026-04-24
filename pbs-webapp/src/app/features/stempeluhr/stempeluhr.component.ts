import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';

@Component({
  selector: 'app-stempeluhr',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageTitleComponent],
  templateUrl: './stempeluhr.component.html',
  styleUrl: './stempeluhr.component.scss',
})
export class StempeluhrComponent {}

