import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Optional,
  Output,
  Self
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { isEqual } from 'lodash-es';
import { CheckOptionSelectedPipe } from '../../pipes/internal/check-option-selected.pipe';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import {
  CpsTooltipDirective,
  TooltipPosition
} from '../../directives/cps-tooltip.directive';

export type BtnToggleOption = {
  value: any;
  label: string;
  disabled?: boolean;
  tooltip?: string;
};

@Component({
  standalone: true,
  imports: [
    CommonModule,
    CheckOptionSelectedPipe,
    CpsInfoCircleComponent,
    CpsTooltipDirective
  ],
  providers: [CheckOptionSelectedPipe],
  selector: 'cps-button-toggle',
  templateUrl: './cps-button-toggle.component.html',
  styleUrls: ['./cps-button-toggle.component.scss']
})
export class CpsButtonToggleComponent implements ControlValueAccessor, OnInit {
  /**
   * Label or name of the toggle button.
   * @group Props
   */
  @Input() label = '';

  /**
   * An array of options on the toggle button.
   * @group Props
   */
  @Input() options = [] as BtnToggleOption[];

  /**
   * Specifies if multiple values can be selected.
   * @group Props
   */
  @Input() multiple = false;

  /**
   * If it is true, it specifies that the component should be disabled.
   * @group Props
   */
  @Input() disabled = false;

  @Input() mandatory = true; // at least one of the options is mandatory

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

  @Input('value') _value: any = undefined;

  set value(value: any) {
    this._value = value;
    this.onChange(value);
  }

  get value(): any {
    return this._value;
  }

  /**
   * Callback to invoke on value change.
   * @group Emits
   */
  @Output() valueChanged = new EventEmitter<any>();

  constructor(@Self() @Optional() private _control: NgControl) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit() {
    if (this.multiple && !this._value) {
      this._value = [];
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
    if (this.disabled) return;
    const check = event?.target?.checked || false;

    if (this.mandatory && this.multiple && !check && this.value.length < 2) {
      event.target.checked = true;
      return;
    }

    const val = event?.target?.value || undefined;

    if (this.multiple) {
      let res = [] as any;
      if (!check) {
        res = this.value.filter((v: any) => !isEqual(v, val));
      } else {
        this.options.forEach((o) => {
          if (
            this.value.some((v: any) => isEqual(v, o.value)) ||
            isEqual(val, o.value)
          ) {
            res.push(o.value);
          }
        });
      }
      this._updateValue(res);
    } else {
      if (this.mandatory) {
        this._updateValue(val); // radio
      } else {
        this._updateValue(check ? val : undefined);
      }
    }
  }

  private _updateValue(value: any) {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}
}
