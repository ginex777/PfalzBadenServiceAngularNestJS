import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AktivitaetenFilterState, DropdownOption, AKTIVITAET_TYPE_LABELS } from './aktivitaeten.models';

@Component({
  selector: 'app-aktivitaeten-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './aktivitaeten-filter.component.html',
  styleUrl: './aktivitaeten-filter.component.scss',
})
export class AktivitaetenFilterComponent {
  readonly filters = input.required<AktivitaetenFilterState>();
  readonly users = input<DropdownOption[]>([]);
  readonly employees = input<DropdownOption[]>([]);

  readonly filtersChange = output<AktivitaetenFilterState>();
  readonly resetFilters = output<void>();

  protected readonly AKTIVITAET_TYPE_LABELS = AKTIVITAET_TYPE_LABELS;

  protected readonly typeOptions = computed(() => {
    const types = Object.entries(AKTIVITAET_TYPE_LABELS).map(([key, label]) => ({
      value: key,
      label,
    }));
    return [
      { value: '', label: 'Alle Typen' },
      ...types,
    ];
  });

  protected readonly userOptions = computed(() => {
    const opts = this.users().map((u) => ({ value: String(u.id), label: u.name }));
    return [{ value: '', label: 'Alle User' }, ...opts];
  });

  protected readonly employeeOptions = computed(() => {
    const opts = this.employees().map((e) => ({ value: String(e.id), label: e.name }));
    return [{ value: '', label: 'Alle Mitarbeiter' }, ...opts];
  });

  protected onTypeChange(type: string): void {
    this.filtersChange.emit({
      ...this.filters(),
      type: type || undefined,
    });
  }

  protected onUserChange(userId: string): void {
    this.filtersChange.emit({
      ...this.filters(),
      userId: userId ? Number(userId) : null,
    });
  }

  protected onEmployeeChange(employeeId: string): void {
    this.filtersChange.emit({
      ...this.filters(),
      employeeId: employeeId ? Number(employeeId) : null,
    });
  }

  protected onCreatedFromChange(date: string): void {
    this.filtersChange.emit({
      ...this.filters(),
      createdFrom: date || null,
    });
  }

  protected onCreatedToChange(date: string): void {
    this.filtersChange.emit({
      ...this.filters(),
      createdTo: date || null,
    });
  }



  protected getSelectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
