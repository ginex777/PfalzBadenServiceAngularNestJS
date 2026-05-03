import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import type { ControlValueAccessor} from '@angular/forms';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

export interface AppSelectOption {
  readonly value: string;
  readonly label: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
})
export class SelectComponent implements ControlValueAccessor {
  readonly label = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly name = input<string | null>(null);
  readonly options = input<readonly AppSelectOption[]>([]);

  protected readonly value = signal<string>('');
  protected readonly isDisabled = signal<boolean>(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'string' ? value : '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected onChangeEvent(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const next = target.value;
    this.value.set(next);
    this.onChange(next);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
