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
import { TooltipPosition } from '../../directives/cps-tooltip.directive';

export type CpsInputAppearanceType = 'outlined' | 'underlined' | 'borderless';

@Component({
  standalone: true,
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
   * More hints about the input.
   * @group Props
   */
  @Input() hint = '';

  /**
   * Hint text for the input field.
   * @group Props
   */
  @Input() placeholder = 'Please enter';

  /**
   * If it is true, it specifies that the component should be disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Width of the input field.
   * @group Props
   */
  @Input() width: number | string = '100%';

  /**
   * Type of the input.
   * @group Props
   */
  @Input() type: 'text' | 'number' | 'password' = 'text';

  /**
   *When enabled, a loading bar is displayed when data is being collected.
   * @group Props
   */
  @Input() loading = false;

  /**
   *Options for clearing input, when enabled, a clear icon is displayed to clear the value.
   * @group Props
   */
  @Input() clearable = false;

  /**
   * Icon before input value.
   * @group Props
   */
  @Input() prefixIcon: IconType = '';

  /**
   * When enabled, icon will be clickable.
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
   *Options for hiding details.
   * @group Props
   */
  @Input() hideDetails = false;

  @Input() persistentClear = false;
  @Input() error = '';

  /**
   *When it is not an empty string, an info icon is displayed to show text for more info.
   * @group Props
   */
  @Input() infoTooltip = '';
  @Input() infoTooltipClass = 'cps-tooltip-content';

  /**
   * Size of infoTooltip.
   * @group Props
   */
  @Input() infoTooltipMaxWidth: number | string = '100%';
  @Input() infoTooltipPersistent = false;

  /**
   * Position of infoTooltip.
   * @group Props
   */
  @Input() infoTooltipPosition: TooltipPosition = 'top';

  /**
   * Styling appearance of input field.
   * @group Props
   */
  @Input() appearance: CpsInputAppearanceType = 'outlined';

  @Input() set value(value: string) {
    this._value = value;
    this.onChange(value);
  }

  get value(): string {
    return this._value;
  }

  @Output() valueChanged = new EventEmitter<string>();
  @Output() focused = new EventEmitter();
  @Output() prefixIconClicked = new EventEmitter();
  @Output() blurred = new EventEmitter();
  @Output() cleared = new EventEmitter();
  @Output() enterClicked = new EventEmitter();

  @ViewChild('prefixTextSpan') prefixTextSpan: ElementRef | undefined;

  currentType = '';
  prefixWidth = '';
  cvtWidth = '';

  private _statusChangesSubscription: Subscription = new Subscription();
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
    ) as Subscription;
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

  onBlur() {
    this._control?.control?.markAsTouched();
    this._checkErrors();
    this.blurred.emit();
  }

  onClickPrefixIcon() {
    if (!this.prefixIconClickable) return;
    this.prefixIconClicked.emit();
  }

  onFocus() {
    this.focused.emit();
  }

  focus() {
    this.elementRef?.nativeElement?.querySelector('input')?.focus();
  }
}
