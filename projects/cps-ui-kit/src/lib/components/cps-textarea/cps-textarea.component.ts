import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { convertSize } from '../../utils/internal/size-utils';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import { CpsTooltipPosition } from '../../directives/cps-tooltip.directive';

/**
 * CpsTextareaComponent is a textarea component.
 * @group Components
 */
@Component({
  standalone: true,
  selector: 'cps-textarea',
  imports: [CommonModule, CpsIconComponent, CpsInfoCircleComponent],
  templateUrl: './cps-textarea.component.html',
  styleUrls: ['./cps-textarea.component.scss']
})
export class CpsTextareaComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  /**
   * Label of the textarea component.
   * @group Props
   */
  @Input() label = '';

  /**
   * Placeholder text for the textarea field.
   * @group Props
   */
  @Input() placeholder = 'Please enter';

  /**
   * Number of rows in the textarea field.
   * @group Props
   */
  @Input() rows = 5;

  /**
   * The cols attribute specifies the visible width of a text area.
   * @group Props
   */
  @Input() cols = 20;

  /**
   * Whether the textarea can auto focus.
   * @group Props
   */
  @Input() autofocus = false;

  /**
   * Bottom hint text for the textarea field.
   * @group Props
   */
  @Input() hint = '';

  /**
   * Whether the component is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Width of the textarea field, it can be of type number denoting pixels or string.
   * @group Props
   */
  @Input() width: number | string = '100%';

  /**
   * Option for clearing textarea, when enabled, a clear icon is displayed to clear the value.
   * @group Props
   */
  @Input() clearable = false;

  /**
   * Hides hint and validation errors.
   * @group Props
   */
  @Input() hideDetails = false;

  /**
   * Whether the component should have persistent clear icon.
   * @group Props
   */
  @Input() persistentClear = false;

  /**
   * Error message.
   * @group Props
   */
  @Input() error = '';

  /**
   * Whether the component can be resized vertically or not.
   * @group Props
   */
  @Input() resizable: 'vertical' | 'none' = 'vertical';

  /**
   *When it is not an empty string, an info icon is displayed to show text for more info.
   * @group Props
   */
  @Input() infoTooltip = '';

  /**
   * Info tooltip class for styling.
   * @group Props
   */
  @Input() infoTooltipClass = 'cps-tooltip-content';

  /**
   * Max width of infoTooltip, of type number denoting pixels or string.
   * @group Props
   */
  @Input() infoTooltipMaxWidth: number | string = '100%';

  /**
   * Whether the infoTooltip is persistent.
   * @group Props
   */
  @Input() infoTooltipPersistent = false;

  /**
   * Position of infoTooltip, it can be 'top', 'bottom', 'left' or 'right'.
   * @group Props
   */
  @Input() infoTooltipPosition: CpsTooltipPosition = 'top';

  /**
   * Value of the textarea.
   * @group Props
   */
  @Input() set value(value: string) {
    if (!value) value = '';
    this._value = value;
    this.onChange(value);
  }

  get value(): string {
    return this._value;
  }

  /**
   * Callback to invoke on value change.
   * @param {string} string - value changed.
   * @group Emits
   */
  @Output() valueChanged = new EventEmitter<string>();

  /**
   * Callback to invoke when the component receives focus.
   * @param {any}
   * @group Emits
   */
  @Output() focused = new EventEmitter();

  /**
   * Callback to invoke when the prefixIcon is clicked.
   * @param {any}.
   * @group Emits
   */
  @Output() prefixIconClicked = new EventEmitter();

  /**
   * Callback to invoke when the component loses focus.
   * @param {any}.
   * @group Emits
   */
  @Output() blurred = new EventEmitter();

  private _statusChangesSubscription: Subscription = new Subscription();
  private _value = '';

  cvtWidth = '';

  constructor(
    @Self() @Optional() private _control: NgControl,
    private _elementRef: ElementRef<HTMLElement>
  ) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.cvtWidth = convertSize(this.width);

    this._statusChangesSubscription = this._control?.statusChanges?.subscribe(
      () => {
        this._checkErrors();
      }
    ) as Subscription;
  }

  ngOnDestroy() {
    this._statusChangesSubscription?.unsubscribe();
  }

  private _checkErrors() {
    if (!this._control) return;
    const errors = this._control?.errors;

    if (!this._control?.control?.touched || !errors) {
      this.error = '';
      return;
    }

    if ('required' in errors) {
      this.error = 'Field is required';
      return;
    }

    if ('pattern' in errors) {
      this.error = 'Value is invalid';
      return;
    }

    if ('minlength' in errors) {
      // eslint-disable-next-line dot-notation
      this.error = `Field must contain at least ${errors['minlength'].requiredLength} characters`;
      return;
    }

    if ('maxlength' in errors) {
      // eslint-disable-next-line dot-notation
      this.error = `Field must contain ${errors['maxlength'].requiredLength} characters maximum`;
      return;
    }

    const errArr = Object.values(errors);
    if (errArr.length < 1) {
      this.error = '';
      return;
    }
    const message = errArr.find((msg) => typeof msg === 'string');

    this.error = message || 'Unknown error';
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChange = (event: any) => {};

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched = () => {};

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  writeValue(value: string) {
    this.value = value;
  }

  updateValueEvent(event: any) {
    const value = event?.target?.value || '';
    this._updateValue(value);
  }

  private _updateValue(value: string) {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  clear() {
    if (this.value !== '') this._updateValue('');
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}

  onBlur() {
    this._control?.control?.markAsTouched();
    this._checkErrors();
    this.blurred.emit();
  }

  onFocus() {
    this.focused.emit();
  }

  focus() {
    this._elementRef?.nativeElement?.querySelector('textarea')?.focus();
  }
}
