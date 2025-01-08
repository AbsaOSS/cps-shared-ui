import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import {
  CpsIconComponent,
  IconType,
  iconSizeType
} from '../cps-icon/cps-icon.component';
import { Subscription } from 'rxjs';
import { convertSize } from '../../utils/internal/size-utils';
import { CpsProgressLinearComponent } from '../cps-progress-linear/cps-progress-linear.component';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import { CpsTooltipPosition } from '../../directives/cps-tooltip/cps-tooltip.directive';

/**
 * CpsInputAppearanceType is used to define the border of the input field.
 * @group Types
 */
export type CpsInputAppearanceType = 'outlined' | 'underlined' | 'borderless';

/**
 * CpsInputComponent is used to enter values in a certain formats such as numeric, text or password.
 * @group Components
 */
@Component({
  imports: [
    CommonModule,
    CpsIconComponent,
    CpsInfoCircleComponent,
    CpsProgressLinearComponent
  ],
  selector: 'cps-input',
  templateUrl: './cps-input.component.html',
  styleUrls: ['./cps-input.component.scss']
})
export class CpsInputComponent
  implements ControlValueAccessor, OnInit, AfterViewInit, OnDestroy
{
  /**
   * Label of the input element.
   * @group Props
   */
  @Input() label = '';

  /**
   * Bottom hint text for the input field.
   * @group Props
   */
  @Input() hint = '';

  /**
   * Placeholder text for the input field.
   * @group Props
   */
  @Input() placeholder = 'Please enter';

  /**
   * Determines whether input is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Determines whether input is readonly.
   * @group Props
   */
  @Input() readonly = false;

  /**
   * Width of the input field, of type number denoting pixels or string.
   * @group Props
   */
  @Input() width: number | string = '100%';

  /**
   * Type of the input of type 'text', 'number' or 'password'.
   * @group Props
   */
  @Input() type: 'text' | 'number' | 'password' = 'text';

  /**
   * When enabled, a loading bar is displayed.
   * @group Props
   */
  @Input() loading = false;

  /**
   * When enabled, a clear icon is displayed to clear the value.
   * @group Props
   */
  @Input() clearable = false;

  /**
   * Icon before input value.
   * @group Props
   */
  @Input() prefixIcon: IconType = '';

  /**
   * When enabled, prefixIcon is clickable.
   * @group Props
   */
  @Input() prefixIconClickable = false;

  /**
   * Size of icon before input value.
   * @group Props
   */
  @Input() prefixIconSize: iconSizeType = '18px';

  /**
   * Text before input value.
   * @group Props
   */
  @Input() prefixText = '';

  /**
   * Hides hint and validation errors.
   * @group Props
   */
  @Input() hideDetails = false;

  /**
   * Determines whether the component should have persistent clear icon.
   * @group Props
   */
  @Input() persistentClear = false;

  /**
   * Error message.
   * @group Props
   */
  @Input() error = '';

  /**
   * When it is not an empty string, an info icon is displayed to show text for more info.
   * @group Props
   */
  @Input() infoTooltip = '';

  /**
   * InfoTooltip class for styling.
   * @group Props
   */
  @Input() infoTooltipClass = 'cps-tooltip-content';

  /**
   * Max width of infoTooltip, of type number denoting pixels or string.
   * @group Props
   */
  @Input() infoTooltipMaxWidth: number | string = '100%';

  /**
   * Determines whether the infoTooltip is persistent.
   * @group Props
   */
  @Input() infoTooltipPersistent = false;

  /**
   * Position of infoTooltip, it can be 'top', 'bottom', 'left' or 'right'.
   * @group Props
   */
  @Input() infoTooltipPosition: CpsTooltipPosition = 'top';

  /**
   * Styling appearance of input field, it can be "outlined" or "underlined" or "borderless".
   * @group Props
   */
  @Input() appearance: CpsInputAppearanceType = 'outlined';

  /**
   * Readonly value to display inside of input field.
   * @group Props
   */
  @Input() valueToDisplay = '';

  /**
   * Value of the input.
   * @default ''
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
   * Callback to invoke when the prefix icon is clicked.
   * @param {any}
   * @group Emits
   */
  @Output() prefixIconClicked = new EventEmitter();

  /**
   * Callback to invoke when the component loses focus.
   * @param {any}
   * @group Emits
   */
  @Output() blurred = new EventEmitter();

  /**
   * Callback to invoke when x icon is clicked.
   * @param {any}
   * @group Emits
   */
  @Output() cleared = new EventEmitter();

  /**
   * Callback to invoke when enter is clicked.
   * @param {any}
   * @group Emits
   */
  @Output() enterClicked = new EventEmitter();

  @ViewChild('prefixTextSpan') prefixTextSpan: ElementRef | undefined;

  currentType = '';
  prefixWidth = '';
  cvtWidth = '';

  private _statusChangesSubscription?: Subscription;
  private _value = '';

  constructor(
    @Self() @Optional() private _control: NgControl,
    public elementRef: ElementRef<HTMLElement>,
    private cdRef: ChangeDetectorRef
  ) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.currentType = this.type;
    this.cvtWidth = convertSize(this.width);

    this._statusChangesSubscription = this._control?.statusChanges?.subscribe(
      () => {
        this._checkErrors();
      }
    );
  }

  ngAfterViewInit() {
    let w = 0;
    if (this.prefixText) {
      w = this.prefixTextSpan?.nativeElement?.offsetWidth + 22;
    }
    if (this.prefixIcon) {
      w += 38 - (this.prefixText ? 14 : 0);
    }
    this.prefixWidth = w > 0 ? `${w}px` : '';
    this.cdRef.detectChanges();
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

    if ('email' in errors) {
      this.error = 'Email format is invalid';
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

  onInputEnterKeyDown() {
    this.elementRef?.nativeElement?.querySelector('input')?.blur();
    this.enterClicked.emit();
  }

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

  onClear() {
    this.clear();
    this.cleared.emit();
  }

  clear() {
    if (this.value !== '') this._updateValue('');
  }

  togglePassword() {
    this.currentType = this.currentType === 'password' ? 'text' : 'password';
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}

  onClickPrefixIcon() {
    if (!this.prefixIconClickable || this.readonly || this.disabled) return;
    this.prefixIconClicked.emit();
  }

  onBlur() {
    this._checkErrors();
    this.blurred.emit();
  }

  onFocus() {
    this._control?.control?.markAsTouched();
    this.focused.emit();
  }

  focus() {
    this.elementRef?.nativeElement?.querySelector('input')?.focus();
  }
}
