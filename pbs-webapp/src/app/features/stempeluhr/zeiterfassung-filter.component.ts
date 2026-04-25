import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ZeiterfassungFilterState, DropdownOption } from './zeiterfassung.models';

@Component({
  selector: 'app-zeiterfassung-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './zeiterfassung-filter.component.html',
  styleUrl: './zeiterfassung-filter.component.scss',
})
export class ZeiterfassungFilterComponent {
  readonly filters = input.required<ZeiterfassungFilterState>();
  readonly mitarbeiter = input.required<readonly DropdownOption[]>();
  readonly objekte = input.required<readonly DropdownOption[]>();
  readonly kunden = input.required<readonly DropdownOption[]>();

  readonly filtersChange = output<ZeiterfassungFilterState>();
  readonly resetFilters = output<void>();

  protected mitarbeiterOptions = computed(() => {
    const list = [...this.mitarbeiter()].sort((a, b) => a.name.localeCompare(b.name));
    return [{ id: 0, name: 'Alle Mitarbeiter' }, ...list];
  });

  protected objekteOptions = computed(() => {
    const list = [...this.objekte()].sort((a, b) => a.name.localeCompare(b.name));
    return [{ id: 0, name: 'Alle Objekte' }, ...list];
  });

  protected kundenOptions = computed(() => {
    const list = [...this.kunden()].sort((a, b) => a.name.localeCompare(b.name));
    return [{ id: 0, name: 'Alle Kunden' }, ...list];
  });

  protected onMitarbeiterChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const v = target.value ? Number(target.value) : null;
    this.emit({ mitarbeiterId: Number.isFinite(v ?? NaN) ? v : null });
  }

  protected onObjektChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const v = target.value ? Number(target.value) : null;
    this.emit({ objektId: Number.isFinite(v ?? NaN) ? v : null });
  }

  protected onKundenChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const v = target.value ? Number(target.value) : null;
    this.emit({ kundenId: Number.isFinite(v ?? NaN) ? v : null });
  }

  protected onVonChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.emit({ von: target.value });
  }

  protected onBisChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.emit({ bis: target.value });
  }

  protected onReset(): void {
    this.reset.emit();
  }

  private emit(patch: Partial<ZeiterfassungFilterState>): void {
    this.filtersChange.emit({ ...this.filters(), ...patch });
  }
}
