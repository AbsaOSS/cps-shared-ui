/* eslint-disable no-use-before-define */
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  InjectionToken,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import {
  CpsTooltipPosition
} from '../../directives/cps-tooltip/cps-tooltip.directive';
import { CpsRadioButtonComponent } from './cps-radio-button/cps-radio-button.component';
import { Subscription } from 'rxjs';

/**
 * CpsRadioOption is used to define the options of the CpsRadioGroupComponent.
 * @group Types
 */
export type CpsRadioOption = {
  value: any;
  label?: string;
  disabled?: boolean;
  tooltip?: string;
};

export const CPS_RADIO_GROUP = new InjectionToken<CpsRadioGroupComponent>(
  'CpsRadioGroupComponent'
);

/**
 * CpsRadioGroupComponent is a radio buttons group.
 * @group Components
 */
@Component({
  imports: [
    CommonModule,
    CpsInfoCircleComponent,
    CpsRadioButtonComponent
  ],
  selector: 'cps-radio-group',
  templateUrl: './cps-radio-group.component.html',
  styleUrls: ['./cps-radio-group.component.scss'],
  providers: [
    {
      provide: CPS_RADIO_GROUP,
      useExisting: CpsRadioGroupComponent
    }
  ]
})
export class CpsRadioGroupComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  /**
   * An array of options.
   * @group Props
   */
  @Input() options: CpsRadioOption[] = [];

  /**
   * Label of the radio group.
   * @group Props
   */
  @Input() groupLabel = '';

  /**
   * Determines whether the radio group should be vertical.
   * @group Props
   */
  @Input() vertical = false;

  /**
   * Determines whether the radio group is disabled.
   * @group Props
   */
  @Input() disabled = false;

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
   * Size of infoTooltip, of type number denoting pixels or string.
   * @group Props
   */
  @Input() infoTooltipMaxWidth: number | string = '100%';

  /**
   * Determines whether the infoTooltip is persistent.
   * @group Props
   */
  @Input() infoTooltipPersistent = false;

  /**
   * Position of infoTooltip, it can be "top", "bottom", "left" or "right".
   * @group Props
   */
  @Input() infoTooltipPosition: CpsTooltipPosition = 'top';

  /**
   * Bottom hint text for the radio group.
   * @group Props
   */
  @Input() hint = '';

  /**
   * Hides hint and validation errors.
   * @group Props
   */
  @Input() hideDetails = false;

  /**
   * Value of the radio group.
   * @group Props
   */
  @Input() set value(value: any) {
    this._value = value;
    this.onChange(value);
  }

  get value(): any {
    return this._value;
  }

  /**
   * Callback to invoke on value change.
   * @param {boolean} boolean - value changed.
   * @group Emits
   */
  @Output() valueChanged = new EventEmitter<boolean>();

  /**
   * Callback to invoke when the radio group loses focus.
   * @param {any}
   * @group Emits
   */
  @Output() blurred = new EventEmitter();

  /**
   * Callback to invoke when the radio group receives focus.
   * @param {any}
   * @group Emits
   */
  @Output() focused = new EventEmitter();

  private _statusChangesSubscription?: Subscription;
  private _value: any = undefined;

  error = '';

  constructor(@Self() @Optional() private _control: NgControl) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this._statusChangesSubscription = this._control?.statusChanges?.subscribe(
      () => {
        this._checkErrors();
      }
    );
  }

  ngOnDestroy() {
    this._statusChangesSubscription?.unsubscribe();
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

  writeValue(value: any) {
    this.value = value;
  }

  updateValueEvent(value: any) {
    if (this.disabled) return;
    this._updateValue(value);
  }

  private _updateValue(value: any) {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}

  onBlur() {
    this._checkErrors();
    this.blurred.emit();
  }

  onFocus() {
    this._control?.control?.markAsTouched();
    this.focused.emit();
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

    const errArr = Object.values(errors);
    if (errArr.length < 1) {
      this.error = '';
      return;
    }
    const message = errArr.find((msg) => typeof msg === 'string');

    this.error = message || 'Unknown error';
  }
}
