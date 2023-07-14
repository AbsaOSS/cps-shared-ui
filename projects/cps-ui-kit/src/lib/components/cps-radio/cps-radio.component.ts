import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Optional,
  Output,
  Self
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import { CpsTooltipDirective } from '../../directives/cps-tooltip.directive';

export type RadioOption = {
  value: any;
  label: string;
  disabled?: boolean;
  tooltip?: string;
};

@Component({
  standalone: true,
  imports: [CommonModule, CpsInfoCircleComponent, CpsTooltipDirective],
  selector: 'cps-radio',
  templateUrl: './cps-radio.component.html',
  styleUrls: ['./cps-radio.component.scss']
})
export class CpsRadioComponent implements ControlValueAccessor {
  @Input() options = [] as RadioOption[];
  @Input() groupLabel = '';
  @Input() vertical = false;
  @Input() disabled = false;
  @Input() tooltip = '';
  @Input() tooltipClass = 'cps-tooltip-content';

  @Input() set value(value: any) {
    this._value = value;
    this.onChange(value);
  }

  get value(): any {
    return this._value;
  }

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
