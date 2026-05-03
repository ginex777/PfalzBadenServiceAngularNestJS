import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent implements ControlValueAccessor {
  readonly label = input<string | null>(null);
  readonly placeholder = input<string>('');
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly type = input<'text' | 'email' | 'password' | 'number' | 'search'>('text');
  readonly autocomplete = input<string | null>(null);
  readonly inputMode = input<
    'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search' | null
  >(null);
  readonly name = input<string | null>(null);

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

  protected onInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const next = target.value;
    this.value.set(next);
    this.onChange(next);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
