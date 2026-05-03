import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import type { ControlValueAccessor} from '@angular/forms';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
})
export class TextareaComponent implements ControlValueAccessor {
  readonly label = input<string | null>(null);
  readonly placeholder = input<string>('');
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly rows = input<number>(4);
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
    if (!(target instanceof HTMLTextAreaElement)) return;
    const next = target.value;
    this.value.set(next);
    this.onChange(next);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
