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
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { CpsIconComponent, iconSizeType } from '../cps-icon/cps-icon.component';
import { Subscription } from 'rxjs';
import { convertSize } from '../../utils/size-utils';

@Component({
  standalone: true,
  imports: [CommonModule, CpsIconComponent],
  selector: 'cps-input',
  templateUrl: './cps-input.component.html',
  styleUrls: ['./cps-input.component.scss'],
})
export class CpsInputComponent
  implements ControlValueAccessor, OnInit, AfterViewInit, OnDestroy
{
  @Input() label = '';
  @Input() placeholder = 'Please enter';
  @Input() hint = '';
  @Input() disabled = false;
  @Input() width: number | string = '100%';
  @Input() type: 'text' | 'number' | 'password' = 'text';
  @Input() loading = false;
  @Input() clearable = false;
  @Input() prefixIcon = '';
  @Input() prefixIconSize: iconSizeType = 'small';
  @Input() prefixText = '';
  @Input() set value(value: string) {
    this._value = value;
    this.onChange(value);
  }
  get value(): string {
    return this._value;
  }

  @Output() valueChanged = new EventEmitter<string>();

  @ViewChild('prefixTextSpan') prefixTextSpan: ElementRef | undefined;

  private _statusChangesSubscription: Subscription = new Subscription();

  private _value = '';

  error = '';
  currentType = '';
  prefixWidth = '';
  cvtWidth = '';

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
      this.error = `Field must contain at least ${errors['minlength'].requiredLength} characters`;
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

  setDisabledState(disabled: boolean) {}

  onBlur() {
    this._control?.control?.markAsTouched();
    this._checkErrors();
  }

  focus() {
    this._elementRef?.nativeElement?.querySelector('input')?.focus();
  }
}
