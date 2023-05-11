import { CommonModule } from '@angular/common';
import {
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
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { convertSize } from '../../utils/size-utils';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { LabelByValuePipe } from '../../pipes/label-by-value.pipe';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ClickOutsideDirective,
    CpsIconComponent,
    LabelByValuePipe,
  ],
  selector: 'cps-select',
  templateUrl: './cps-select.component.html',
  styleUrls: ['./cps-select.component.scss'],
})
export class CpsSelectComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  @Input() label = '';
  @Input() placeholder = 'Please select';
  @Input() hint = '';
  @Input() multiple = false; //TODO
  @Input() disabled = false;
  @Input() singleLine = false; //occupy one line plus text (+n others) //TODO only if multiple === true
  @Input() width: number | string = '100%';
  @Input() selectAll = false; //TODO only if multiple === true
  @Input() chips = true; //TODO only if multiple === true
  @Input() closableChips = true; //TODO only if multiple === true
  @Input() clearable = false;
  @Input() openOnClear = true;
  @Input() options = [] as any[];
  @Input() optionLabel = 'label';
  @Input() optionValue: string = 'value'; //works only if returnObject === false
  @Input() returnObject = true;
  @Input() optionInfo = 'info';
  @Input() hideDetails = false;
  @Input() set value(value: any) {
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
  private _value = undefined;

  error = '';
  cvtWidth = '';

  constructor(@Self() @Optional() private _control: NgControl) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit() {
    this.cvtWidth = convertSize(this.width);

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
      //TODO for multiple case
      const element =
        this.selectContainer.nativeElement.querySelector('.selected');
      if (element) element.scrollIntoView();
    }
  }

  select(option: any): void {
    this.updateValue(this.returnObject ? option : option[this.optionValue]);
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
      if (typeof value !== 'string') {
        value = value ? value[this.optionValue] : '';
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

    if (this.value) {
      if (this.openOnClear) {
        this.toggleOptions(dd, true);
      }
      this.updateValue(this.returnObject ? undefined : '');
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
