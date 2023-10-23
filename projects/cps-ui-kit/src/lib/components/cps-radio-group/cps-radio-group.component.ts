/* eslint-disable no-use-before-define */
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  InjectionToken,
  Input,
  Optional,
  Output,
  Self
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import {
  CpsTooltipDirective,
  TooltipPosition
} from '../../directives/cps-tooltip.directive';
import { CpsRadioButtonComponent } from './cps-radio-button/cps-radio-button.component';

export type RadioOption = {
  value: any;
  label?: string;
  disabled?: boolean;
  tooltip?: string;
};

export const CPS_RADIO_GROUP = new InjectionToken<CpsRadioGroupComponent>(
  'CpsRadioGroupComponent'
);

@Component({
  standalone: true,
  imports: [
    CommonModule,
    CpsInfoCircleComponent,
    CpsTooltipDirective,
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
export class CpsRadioGroupComponent implements ControlValueAccessor {
  /**
   * An array of object type {
      value: any;
      label?: string;
      disabled?: boolean;
      tooltip?: string;
    }.
   * @group Props
   */
  @Input() options = [] as RadioOption[];
  /**
   * Group label of the radio element.
   * @group Props
   */
  @Input() groupLabel = '';
  /**
   * Whether the radio element should be vertical.
   * @group Props
   */
  @Input() vertical = false;
  /**
   * When present, it specifies that the element should be disabled.
   * @group Props
   */
  @Input() disabled = false;
  /**
   *When it is not an empty string, an info icon is displayed to show text for more info.
   * @group Props
   */
  @Input() infoTooltip = '';
  @Input() infoTooltipClass = 'cps-tooltip-content';
  /**
   * Size of infoTooltip, of type number or string.
   * @group Props
   */
  @Input() infoTooltipMaxWidth: number | string = '100%';
  @Input() infoTooltipPersistent = false;
  /**
   * Position of infoTooltip, it can be "top" or "bottom" or "left" or "right".
   * @group Props
   */
  @Input() infoTooltipPosition: TooltipPosition = 'top';

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

  private _value: any = undefined;

  constructor(@Self() @Optional() private _control: NgControl) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
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

  updateValueEvent(event: any) {
    event.preventDefault();
    if (this.disabled) return;
    const value = event?.target?.value || '';
    this._updateValue(value);
  }

  private _updateValue(value: any) {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}
}
