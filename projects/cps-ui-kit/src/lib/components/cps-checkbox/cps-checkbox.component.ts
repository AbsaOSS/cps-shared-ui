import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Optional,
  Output,
  Self
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'cps-checkbox',
  templateUrl: './cps-checkbox.component.html',
  styleUrls: ['./cps-checkbox.component.scss']
})
export class CpsCheckboxComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() disabled = false;
  @Input() set value (value: boolean) {
    this._value = value;
    this.onChange(value);
  }

  get value (): boolean {
    return this._value;
  }

  @Output() valueChanged = new EventEmitter<boolean>();

  private _value = false;

  constructor (
    @Self() @Optional() private _control: NgControl,
    private _elementRef: ElementRef<HTMLElement>
  ) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChange = (event: any) => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched = () => {};

  registerOnChange (fn: any) {
    this.onChange = fn;
  }

  registerOnTouched (fn: any) {
    this.onTouched = fn;
  }

  writeValue (value: boolean) {
    this.value = value;
  }

  updateValueEvent (event: any) {
    event.preventDefault();
    if (this.disabled) return;
    this._updateValue(!this.value);
  }

  private _updateValue (value: boolean) {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState (disabled: boolean) {}

  focus () {
    this._elementRef?.nativeElement?.querySelector('input')?.focus();
  }
}
