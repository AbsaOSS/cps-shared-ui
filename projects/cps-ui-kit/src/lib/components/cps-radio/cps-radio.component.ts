import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Optional,
  Output,
  Self,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

export type RadioOption = {
  value: any;
  label: string;
  disabled?: boolean;
};

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'cps-radio',
  templateUrl: './cps-radio.component.html',
  styleUrls: ['./cps-radio.component.scss'],
})
export class CpsRadioComponent implements ControlValueAccessor {
  @Input() options = [] as RadioOption[];
  @Input() groupLabel = '';
  @Input() vertical = false;
  @Input() disabled = false;
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

  onChange = (event: any) => {};
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

  setDisabledState(disabled: boolean) {}
}
