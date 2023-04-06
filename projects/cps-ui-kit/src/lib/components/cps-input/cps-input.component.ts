import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Self,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'cps-input',
  templateUrl: './cps-input.component.html',
  styleUrls: ['./cps-input.component.scss'],
})
export class CpsInputComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  @Input() label = '';
  @Input() placeholder = 'Enter value';
  @Input() hint = '';
  @Input() disabled = false;
  @Input() width = '100%';
  @Input() type = 'text';
  @Input() loading = false;
  //@Input() clearable = false; //TODO after buttons and icons are implemented

  private _statusChangesSubscription: Subscription = new Subscription();

  private _value = '';

  error = '';
  currentType = '';

  set value(value: any) {
    this._value = value;
    this.onChange(value);
  }

  get value(): any {
    return this._value;
  }

  constructor(
    @Self() @Optional() private _control: NgControl,
    private _elementRef: ElementRef<HTMLElement>
  ) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.currentType = this.type;
    this._statusChangesSubscription = this._control?.statusChanges?.subscribe(
      () => {
        this._checkErrors();
      }
    ) as Subscription;
  }

  togglePassword() {
    this.currentType = this.currentType === 'password' ? 'text' : 'password';
  }

  private _checkErrors() {
    const errors = this._control?.errors;

    if (!this._control?.control?.touched || !errors) {
      this.error = '';
      return;
    }

    if (errors.hasOwnProperty('required')) {
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

  updateValue(event: any) {
    const value = event.target.value;
    this.writeValue(value);
    this.onChange(value);
  }

  setDisabledState(disabled: boolean) {
    this.disabled = disabled;
  }

  onBlur() {
    this._control?.control?.markAsTouched();
    this._checkErrors();
  }

  focus() {
    this._elementRef?.nativeElement?.querySelector('input')?.focus();
  }

  ngOnDestroy() {
    this._statusChangesSubscription?.unsubscribe();
  }
}
