import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-confirm-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfirmModalComponent],
  templateUrl: './confirm-host.component.html',
})
export class ConfirmHostComponent {
  protected readonly confirmService = inject(ConfirmService);
}
