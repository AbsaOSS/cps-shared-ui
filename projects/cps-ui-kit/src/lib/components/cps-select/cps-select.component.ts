import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { convertSize } from '../../utils/size-utils';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsChipComponent } from '../cps-chip/cps-chip.component';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { LabelByValuePipe } from '../../pipes/label-by-value.pipe';
import { CombineLabelsPipe } from '../../pipes/combine-labels.pipe';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ClickOutsideDirective,
    CpsIconComponent,
    CpsChipComponent,
    LabelByValuePipe,
    CombineLabelsPipe,
  ],
  selector: 'cps-select',
  templateUrl: './cps-select.component.html',
  styleUrls: ['./cps-select.component.scss'],
})
export class CpsSelectComponent
  implements ControlValueAccessor, OnInit, OnDestroy, OnChanges
{
  @Input() label = '';
  @Input() placeholder = 'Please select';
  @Input() hint = '';
  @Input() returnObject = true;
  @Input() multiple = false;
  @Input() disabled = false;
  @Input() width: number | string = '100%';
  @Input() selectAll = true;
  @Input() chips = true;
  @Input() closableChips = true;
  @Input() clearable = false;
  @Input() openOnClear = true;
  @Input() options = [] as any[];
  @Input() optionLabel = 'label';
  @Input() optionValue: string = 'value'; //works only if returnObject === false (TODO potentially can be of any type)
  @Input() optionInfo = 'info';
  @Input() hideDetails = false;

  @Input('value') _value: any = undefined;

  set value(value: any) {
    value = this._convertValue(value);
    this._value = value;
    this.onChange(value);
  }
  get value(): any {
    return this._value;
  }

  @Output() valueChanged = new EventEmitter<any>();

  @ViewChild('selectContainer')
  selectContainer!: ElementRef;

  private _statusChangesSubscription: Subscription = new Subscription();

  error = '';
  cvtWidth = '';

  constructor(@Self() @Optional() private _control: NgControl) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('_value' in changes && changes['_value'].isFirstChange()) {
      this.value = this._convertValue(this.value);
    }
  }

  ngOnInit() {
    this.cvtWidth = convertSize(this.width);
    if (this.multiple && !this._value) {
      this._value = [];
    }

    this._statusChangesSubscription = this._control?.statusChanges?.subscribe(
      () => {
        this._checkErrors();
      }
    ) as Subscription;
  }

  ngOnDestroy() {
    this._statusChangesSubscription?.unsubscribe();
  }

  toggleOptions(dd: HTMLElement, show?: boolean): void {
    if (this.disabled || !dd) return;
    if (typeof show === 'boolean') {
      if (show) {
        dd.classList.add('active');
      } else dd.classList.remove('active');
    } else dd.classList.toggle('active');
    if (dd.classList.contains('active')) {
      const selected =
        this.selectContainer.nativeElement.querySelector('.selected');
      if (selected) selected.scrollIntoView();
    }
  }

  select(option: any, byValue: boolean): void {
    const val = byValue
      ? option
      : this.returnObject
      ? option
      : option[this.optionValue];
    if (this.multiple) {
      let res = [] as any;
      if (this.value.includes(val)) {
        res = this.value.filter((v: any) => v !== val);
      } else {
        this.options.forEach((o) => {
          const ov = this.returnObject ? o : o[this.optionValue];
          if (this.value.some((v: any) => v === ov) || val === ov) {
            res.push(ov);
          }
        });
      }
      this.updateValue(res);
    } else {
      this.updateValue(val);
    }
  }

  toggleAll() {
    let res = [];
    if (this.value.length < this.options.length) {
      if (this.returnObject) {
        res = this.options;
      } else {
        this.options.forEach((o) => {
          res.push(o[this.optionValue]);
        });
      }
    }
    this.updateValue(res);
  }

  private _checkErrors(): void {
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

  onClear(): void {
    this._control?.control?.markAsTouched();
    this._checkErrors();
  }

  onChange = (event: any) => {};
  onTouched = () => {};

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  private _convertValue(value: any): any {
    if (!this.returnObject) {
      if (this.multiple) {
        if (Array.isArray(value)) {
          const temp: any = [];
          value.forEach((v) => {
            if (typeof v !== 'string') {
              temp.push(v ? v[this.optionValue] : '');
            } else temp.push(v);
          });
          value = temp;
        } else {
          if (!value) value = [];
          else {
            if (typeof value !== 'string') {
              value = [value[this.optionValue]];
            } else value = [value];
          }
        }
      } else {
        if (typeof value !== 'string') {
          value = value ? value[this.optionValue] : '';
        }
      }
    } else {
      if (this.multiple) {
        if (!Array.isArray(value)) {
          value = [value];
        }
      }
    }
    return value;
  }

  writeValue(value: any) {
    value = this._convertValue(value);
    this.value = value;
  }

  private updateValue(value: any): void {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  clear(dd: HTMLElement, event: any): void {
    event.stopPropagation();

    if (
      (!this.multiple && this.value) ||
      (this.multiple && this.value?.length > 0)
    ) {
      if (this.openOnClear) {
        this.toggleOptions(dd, true);
      }
      const val = this.multiple ? [] : this.returnObject ? undefined : '';
      this.updateValue(val);
    }
  }

  setDisabledState(disabled: boolean) {}

  onBlur() {
    this._control?.control?.markAsTouched();
    this._checkErrors();
  }

  focus() {
    this.selectContainer?.nativeElement?.focus();
    this.toggleOptions(this.selectContainer?.nativeElement, true);
  }
}
