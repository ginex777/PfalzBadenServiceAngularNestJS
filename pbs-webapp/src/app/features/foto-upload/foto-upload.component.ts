import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';

@Component({
  selector: 'app-foto-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageTitleComponent],
  templateUrl: './foto-upload.component.html',
  styleUrl: './foto-upload.component.scss',
})
export class FotoUploadComponent {}

