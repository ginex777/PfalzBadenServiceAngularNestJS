import { Component, ChangeDetectionStrategy, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ObjectContextService } from '../../core/object-context.service';
import { ObjectListItem } from '../../core/objects.service';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

@Component({
  selector: 'app-objekt-auswahl-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ion-page' },
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonInput,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonButton,
  ],
  templateUrl: './objekt-auswahl.page.html',
  styleUrl: './objekt-auswahl.page.scss',
})
export class ObjektAuswahlPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly context = inject(ObjectContextService);

  protected readonly query = signal('');
  private readonly returnUrl = signal<string | null>(null);

  protected readonly objects = computed<ObjectListItem[]>(() => this.context.activeObjects());
  protected readonly selectedObjectId = this.context.selectedObjectId;

  private readonly _initEffect = effect(() => {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    this.returnUrl.set(url && url.startsWith('/') ? url : null);
  });

  ionViewWillEnter(): void {
    this.context.ensureObjectsLoaded();
  }

  protected readonly filteredObjects = computed(() => {
    const q = normalize(this.query());
    const rows = this.objects();
    if (!q) return rows;
    return rows.filter((o) => {
      const haystack = normalize(
        [
          o.name,
          o.street,
          o.houseNumber,
          o.postalCode,
          o.city,
          o.customerName,
        ]
          .filter(Boolean)
          .join(' '),
      );
      return haystack.includes(q);
    });
  });

  protected updateQuery(value: unknown): void {
    const next = typeof value === 'string' ? value : '';
    this.query.set(next);
  }

  protected formatLine2(obj: ObjectListItem): string | null {
    const parts = [
      [obj.street, obj.houseNumber].filter(Boolean).join(' ').trim(),
      [obj.postalCode, obj.city].filter(Boolean).join(' ').trim(),
    ].filter((p) => p.length > 0);
    const address = parts.join(' · ');
    const customer = obj.customerName?.trim() ? obj.customerName.trim() : null;
    if (address && customer) return `${address} · ${customer}`;
    return address || customer;
  }

  protected async selectObject(objectId: number): Promise<void> {
    this.context.setSelectedObjectId(objectId);
    await this.router.navigateByUrl(this.returnUrl() ?? '/tabs/heute');
  }

  protected async retry(): Promise<void> {
    this.context.reloadObjects();
  }
}
