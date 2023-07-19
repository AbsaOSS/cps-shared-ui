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
  @Input() label = '';
  @Input() hint = '';
  @Input() placeholder = 'Please enter';
  @Input() disabled = false;
  @Input() width: number | string = '100%';
  @Input() type: 'text' | 'number' | 'password' = 'text';
  @Input() loading = false;
  @Input() clearable = false;
  @Input() prefixIcon: IconType = '';
  @Input() prefixIconClickable = false;
  @Input() prefixIconSize: iconSizeType = '18px';
  @Input() prefixText = '';
  @Input() hideDetails = false;
  @Input() persistentClear = false;
  @Input() error = '';
  @Input() infoTooltip = '';
  @Input() infoTooltipClass = 'cps-tooltip-content';
  @Input() infoTooltipMaxWidth: number | string = '100%';
  @Input() infoTooltipPersistent = false;
  @Input() infoTooltipPosition: TooltipPosition = 'top';

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

  @ViewChild('prefixTextSpan') prefixTextSpan: ElementRef | undefined;

  currentType = '';
  prefixWidth = '';
  cvtWidth = '';

  private _statusChangesSubscription: Subscription = new Subscription();
  private _value = '';

  constructor(
    @Self() @Optional() private _control: NgControl,
    private _elementRef: ElementRef<HTMLElement>,
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
    this._elementRef?.nativeElement?.querySelector('input')?.focus();
  }
}
