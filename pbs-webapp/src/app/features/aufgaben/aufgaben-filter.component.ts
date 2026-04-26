import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Kunde, Mitarbeiter, Objekt } from '../../core/models';
import {
  TaskFilterState,
  TaskStatus,
  TaskType,
  TASK_STATUS_LABELS,
  TASK_TYPE_LABELS,
} from './aufgaben.models';

export interface UserOption {
  id: number;
  label: string;
}

@Component({
  selector: 'app-aufgaben-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './aufgaben-filter.component.html',
  styleUrl: './aufgaben-filter.component.scss',
})
export class AufgabenFilterComponent {
  readonly filters = input.required<TaskFilterState>();
  readonly customers = input.required<readonly Kunde[]>();
  readonly objects = input.required<readonly Objekt[]>();
  readonly employees = input.required<readonly Mitarbeiter[]>();
  readonly users = input.required<readonly UserOption[]>();

  readonly filtersChange = output<TaskFilterState>();
  readonly resetFilters = output<void>();

  protected readonly typeOptions = computed(() =>
    (Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((type) => ({
      type,
      label: TASK_TYPE_LABELS[type],
    })),
  );

  protected readonly statusOptions = computed(() =>
    (Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((status) => ({
      status,
      label: TASK_STATUS_LABELS[status],
    })),
  );

  protected customerOptions(): readonly { value: string; label: string }[] {
    const options = this.customers()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({ value: String(c.id), label: c.name }));
    return [{ value: '', label: 'Alle Kunden' }, ...options];
  }

  protected objectOptions(): readonly { value: string; label: string }[] {
    const filters = this.filters();
    const customerId = filters.customerId;
    const list = this.objects()
      .filter((o) => (customerId ? o.kunden_id === customerId : true))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((o) => ({ value: String(o.id), label: o.name }));
    return [{ value: '', label: 'Alle Objekte' }, ...list];
  }

  protected employeeOptions(): readonly { value: string; label: string }[] {
    const list = this.employees()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((e) => ({ value: String(e.id), label: e.name }));
    return [{ value: '', label: 'Alle Mitarbeiter' }, ...list];
  }

  protected userOptions(): readonly { value: string; label: string }[] {
    const list = this.users()
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((u) => ({ value: String(u.id), label: u.label }));
    return [{ value: '', label: 'Alle User' }, ...list];
  }

  protected onSearch(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.emit({ q: target.value });
  }

  protected onCustomerChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const v = target.value ? Number(target.value) : null;
    this.emit({ customerId: Number.isFinite(v ?? NaN) ? v : null, objectId: null });
  }

  protected onObjectChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const v = target.value ? Number(target.value) : null;
    this.emit({ objectId: Number.isFinite(v ?? NaN) ? v : null });
  }

  protected onEmployeeChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const v = target.value ? Number(target.value) : null;
    this.emit({ employeeId: Number.isFinite(v ?? NaN) ? v : null });
  }

  protected onUserChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const v = target.value ? Number(target.value) : null;
    this.emit({ userId: Number.isFinite(v ?? NaN) ? v : null });
  }

  protected onTypeChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const raw = target.value as TaskType | '';
    this.emit({ type: raw ? [raw] : [] });
  }

  protected onStatusChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const raw = target.value as TaskStatus | '';
    this.emit({ status: raw ? [raw] : [] });
  }

  protected onCreatedFromChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.emit({ createdFrom: target.value });
  }

  protected onCreatedToChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.emit({ createdTo: target.value });
  }

  protected onDueFromChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.emit({ dueFrom: target.value });
  }

  protected onDueToChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.emit({ dueTo: target.value });
  }

  private emit(patch: Partial<TaskFilterState>): void {
    this.filtersChange.emit({ ...this.filters(), ...patch });
  }
}
