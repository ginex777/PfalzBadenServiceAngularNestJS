import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import { ObjectContextService } from '../../../core/object-context.service';

@Component({
  selector: 'app-objekt-kontext',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton],
  templateUrl: './objekt-kontext.component.html',
  styleUrl: './objekt-kontext.component.scss',
})
export class ObjektKontextComponent {
  private readonly router = inject(Router);
  protected readonly context = inject(ObjectContextService);

  readonly disabled = input(false);

  protected readonly objectTitle = computed(() => this.context.selectedObject()?.name ?? null);

  protected readonly objectSubtitle = computed(() => {
    const obj = this.context.selectedObject();
    if (!obj) return null;
    const address = [obj.street, obj.houseNumber, obj.postalCode, obj.city]
      .filter((part) => (part ?? '').trim().length > 0)
      .join(' ')
      .trim();
    const customer = obj.customerName?.trim() ? obj.customerName.trim() : null;
    if (address && customer) return `${address} · ${customer}`;
    return address || customer;
  });

  constructor() {
    this.context.ensureObjectsLoaded();
  }

  protected async changeObject(): Promise<void> {
    if (this.disabled()) return;
    await this.router.navigate(['/objekt-auswahl'], {
      queryParams: { returnUrl: this.router.url },
    });
  }
}
