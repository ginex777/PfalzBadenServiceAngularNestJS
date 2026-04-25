import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Kunde, Objekt } from '../../core/models';
import { ConfirmModalComponent } from '../../shared/ui/confirm-modal/confirm-modal.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { PageTitleComponent } from '../../shared/ui/page-title/page-title.component';
import { RoleAllowedDirective } from '../../core/directives/role-allowed.directive';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { ObjektFormularComponent } from './components/objekt-formular/objekt-formular.component';
import { EMPTY_OBJECT_FORM, ObjectFormData } from './objekte.models';
import { ObjectsService } from './objekte.service';

type Mode = 'create' | 'edit';

@Component({
  selector: 'app-objekt-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageTitleComponent,
    ErrorStateComponent,
    ConfirmModalComponent,
    ObjektFormularComponent,
    RoleAllowedDirective,
  ],
  templateUrl: './objekt-detail.component.html',
  styleUrl: './objekt-detail.component.scss',
})
export class ObjektDetailComponent implements HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ObjectsService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly customers = signal<Kunde[]>([]);
  protected readonly existingObject = signal<Objekt | null>(null);
  protected readonly mode = signal<Mode>('create');
  protected readonly confirmDeactivateOpen = signal(false);

  protected readonly form = signal<ObjectFormData>({ ...EMPTY_OBJECT_FORM });
  private initialSnapshot: ObjectFormData = { ...EMPTY_OBJECT_FORM };

  protected readonly canEdit = computed(() => this.auth.currentUser()?.rolle === 'admin');

  protected readonly title = computed(() => {
    return this.mode() === 'create' ? 'Objekt anlegen' : 'Objekt bearbeiten';
  });

  protected readonly subtitle = computed(() => {
    const o = this.existingObject();
    if (this.mode() === 'create') return 'Verwaltung — Neues Objekt';
    return o ? `Verwaltung — ${o.name}` : 'Verwaltung — Objekt';
  });

  constructor() {
    this.load();
  }

  hatUngespeicherteAenderungen(): boolean {
    const current = this.form();
    return JSON.stringify(current) !== JSON.stringify(this.initialSnapshot);
  }

  protected load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const isNew = id === 'neu';

    this.mode.set(isNew ? 'create' : 'edit');
    this.isLoading.set(true);
    this.error.set(null);

    this.service.loadInitialData().subscribe({
      next: ({ objects, customers }) => {
        const sortedCustomers = customers.slice().sort((a, b) => a.name.localeCompare(b.name));
        this.customers.set(sortedCustomers);

        if (isNew) {
          this.existingObject.set(null);
          this.setFormFromObject(null, sortedCustomers);
          this.isLoading.set(false);
          return;
        }

        const objectId = Number(id);
        const found = objects.find((o) => o.id === objectId) ?? null;
        if (!found) {
          this.error.set('Objekt nicht gefunden.');
          this.isLoading.set(false);
          return;
        }

        this.existingObject.set(found);
        this.setFormFromObject(found, sortedCustomers);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Objekt konnte nicht geladen werden.');
        this.isLoading.set(false);
      },
    });
  }

  private setFormFromObject(obj: Objekt | null, customers: readonly Kunde[]): void {
    const fallbackCustomerId =
      customers.length === 1 ? String(customers[0].id) : '';

    const next: ObjectFormData = obj
      ? {
          name: obj.name,
          street: obj.strasse ?? '',
          houseNumber: obj.hausnummer ?? '',
          postalCode: obj.plz ?? '',
          city: obj.ort ?? '',
          note: obj.notiz ?? '',
          customerId: obj.kunden_id ? String(obj.kunden_id) : '',
          status: obj.status ?? 'AKTIV',
        }
      : {
          ...EMPTY_OBJECT_FORM,
          customerId: fallbackCustomerId,
        };

    this.form.set(next);
    this.initialSnapshot = { ...next };
  }

  protected onFormChange(next: ObjectFormData): void {
    this.form.set(next);
  }

  protected save(): void {
    if (!this.canEdit()) return;

    const data = this.form();
    const requiredMissing =
      !data.name.trim() ||
      !data.street.trim() ||
      !data.postalCode.trim() ||
      !data.city.trim() ||
      !data.customerId;

    if (requiredMissing) {
      this.toast.error('Bitte Pflichtfelder ausfüllen (Name, Straße, PLZ, Ort, Kunde).');
      return;
    }

    const customerId = Number(data.customerId);
    if (!Number.isFinite(customerId) || customerId <= 0) {
      this.toast.error('Bitte einen gültigen Kunden auswählen.');
      return;
    }

    const basePayload: Partial<Objekt> = {
      name: data.name.trim(),
      strasse: data.street.trim(),
      hausnummer: data.houseNumber.trim() || undefined,
      plz: data.postalCode.trim(),
      ort: data.city.trim(),
      notiz: data.note.trim() || undefined,
      kunden_id: customerId,
      status: data.status,
    };

    const existing = this.existingObject();
    const request =
      this.mode() === 'create'
        ? this.service.createObject(basePayload)
        : this.service.updateObject(existing!.id, {
            ...basePayload,
            // Preserve fields that are not edited in this UI but would be overwritten by the backend DTO defaults.
            vorlage_id: existing?.vorlage_id,
            filter_typen: existing?.filter_typen ?? '',
          });

    this.isLoading.set(true);
    request.subscribe({
      next: (saved) => {
        this.toast.success(this.mode() === 'create' ? 'Objekt angelegt.' : 'Objekt gespeichert.');
        this.existingObject.set(saved);
        this.mode.set('edit');
        this.setFormFromObject(saved, this.customers());
        if (this.route.snapshot.paramMap.get('id') === 'neu') {
          this.router.navigate(['/verwaltung/objekte', saved.id]);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Objekt konnte nicht gespeichert werden.');
        this.isLoading.set(false);
      },
    });
  }

  protected backToList(): void {
    this.router.navigate(['/verwaltung/objekte']);
  }

  protected openDeactivateConfirm(): void {
    if (!this.canEdit()) return;
    this.confirmDeactivateOpen.set(true);
  }

  protected cancelDeactivate(): void {
    this.confirmDeactivateOpen.set(false);
  }

  protected confirmDeactivate(): void {
    const existing = this.existingObject();
    if (!existing || !this.canEdit()) return;

    this.service.deactivateObject(existing.id).subscribe({
      next: () => {
        const updated: Objekt = { ...existing, status: 'INAKTIV' };
        this.existingObject.set(updated);
        this.form.update((f) => ({ ...f, status: 'INAKTIV' }));
        this.initialSnapshot = { ...this.form() };
        this.confirmDeactivateOpen.set(false);
        this.toast.success('Objekt deaktiviert.');
      },
      error: () => this.toast.error('Objekt konnte nicht deaktiviert werden.'),
    });
  }
}
