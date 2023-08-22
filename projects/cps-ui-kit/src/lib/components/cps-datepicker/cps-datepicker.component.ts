import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { CpsInputComponent } from '../cps-input/cps-input.component';
import { Subscription } from 'rxjs';
import { convertSize } from '../../utils/internal/size-utils';
import { TooltipPosition } from '../../directives/cps-tooltip.directive';
import { CpsMenuComponent } from '../cps-menu/cps-menu.component';

export type CpsDatepickerAppearanceType =
  | 'outlined'
  | 'underlined'
  | 'borderless';

@Component({
  standalone: true,
  imports: [
    CpsInputComponent,
    CalendarModule,
    CommonModule,
    FormsModule,
    CpsMenuComponent
  ],
  selector: 'cps-datepicker',
  templateUrl: './cps-datepicker.component.html',
  styleUrls: ['./cps-datepicker.component.scss']
})
export class CpsDatepickerComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  @Input() label = '';
  @Input() disabled = false;
  @Input() width: number | string = '100%';
  @Input() placeholder = 'MM/DD/YYYY';
  @Input() hint = '';
  @Input() clearable = false;
  @Input() hideDetails = false;
  @Input() persistentClear = false;
  @Input() showTodayButton = true;
  @Input() openOnInputFocus = false;
  @Input() infoTooltip = '';
  @Input() infoTooltipClass = 'cps-tooltip-content';
  @Input() infoTooltipMaxWidth: number | string = '100%';
  @Input() infoTooltipPersistent = false;
  @Input() infoTooltipPosition: TooltipPosition = 'top';
  @Input() appearance: CpsDatepickerAppearanceType = 'outlined';

  @Input()
  minDate!: Date;

  @Input()
  maxDate!: Date;

  @Input() set value(value: Date | null) {
    this._value = value;
    this.stringDate = this._dateToString(value);
    this.onChange(value);
  }

  get value(): Date | null {
    return this._value;
  }

  @Output() valueChanged = new EventEmitter<Date | null>();

  @ViewChild('datepickerInput')
  datepickerInput!: CpsInputComponent;

  @ViewChild('calendarMenu')
  calendarMenu!: CpsMenuComponent;

  stringDate = '';
  isOpened = false;
  error = '';
  cvtWidth = '';

  private _statusChangesSubscription: Subscription = new Subscription();
  private _value!: Date | null;

  constructor(@Self() @Optional() private _control: NgControl) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit(): void {
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

  onInputValueChanged(val: string) {
    this.stringDate = val;
    if (!val) {
      this._updateValue(null);
      return;
    }
    const dt = this._stringToDate(val);
    if (dt) this._updateValue(dt);
  }

  writeValue(value: Date | null) {
    this.value = value;
  }

  private _updateValue(value: Date | null) {
    if (this.value === value) return;
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  private _updateValueFromInputString() {
    if (!this.stringDate) {
      this._updateValue(null);
    } else {
      this._updateValue(this._stringToDate(this.stringDate));
    }
  }

  private _checkDateFormat(dateString: string): boolean {
    if (!/^\d\d\/\d\d\/\d\d\d\d$/.test(dateString)) {
      return false;
    }
    const parts = dateString.split('/').map((p) => parseInt(p, 10));
    parts[0] -= 1;
    const d = new Date(parts[2], parts[0], parts[1]);
    return (
      d.getMonth() === parts[0] &&
      d.getDate() === parts[1] &&
      d.getFullYear() === parts[2]
    );
  }

  private _checkDateInRange(date: Date, minDate: Date, maxDate: Date): boolean {
    if (!minDate && !maxDate) return true;
    if (minDate && maxDate) {
      return (
        date.getTime() >= minDate.getTime() &&
        date.getTime() <= maxDate.getTime()
      );
    }
    if (minDate) {
      return date.getTime() >= minDate.getTime();
    }
    return date.getTime() <= maxDate.getTime();
  }

  private _dateToString(dateVal: Date | null): string {
    if (!dateVal) return '';
    let month = '' + (dateVal.getMonth() + 1);
    if (month.length < 2) month = '0' + month;
    let day = '' + dateVal.getDate();
    if (day.length < 2) day = '0' + day;
    const year = dateVal.getFullYear();
    return `${month}/${day}/${year}`;
  }

  private _stringToDate(dateString: string): Date | null {
    if (!this._checkDateFormat(dateString)) return null;
    const [month, day, year] = dateString.split('/');
    const dt = new Date(`${year}-${month}-${day}`);
    const inRange = this._checkDateInRange(dt, this.minDate, this.maxDate);
    return inRange ? dt : null;
  }

  private _checkErrors() {
    if (this.stringDate && !this._stringToDate(this.stringDate)) {
      this.error = 'Date is invalid';
      return;
    }

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

  onSelectCalendarDate(dateVal: Date) {
    this.toggleCalendar(false);
    this._dateToString(dateVal);

    this.writeValue(dateVal);
    this.onChange(dateVal);
    this.valueChanged.emit(dateVal);
  }

  onInputBlur() {
    if (this.isOpened) return;
    this._control?.control?.markAsTouched();
    this._updateValueFromInputString();
    this._checkErrors();
  }

  onInputEnterClicked() {
    if (!this.isOpened) return;
    this._control?.control?.markAsTouched();
    this._updateValueFromInputString();
    this._checkErrors();
    this.toggleCalendar(false);
  }

  onClickCalendarIcon() {
    if (this.disabled) return;
    if (this.isOpened) this._updateValueFromInputString();
    this.toggleCalendar();
  }

  onBeforeCalendarHidden() {
    if (this.disabled || !this.isOpened) return;
    this._updateValueFromInputString();
    this.toggleCalendar(false);
  }

  onInputFocus() {
    if (this.openOnInputFocus) this.toggleCalendar(true);
  }

  onInputClear() {
    if (this.isOpened) this.focusInput();
  }

  onCalendarContentClick() {
    if (this.isOpened) this.focusInput();
  }

  focusInput() {
    this.datepickerInput.focus();
  }

  toggleCalendar(show?: boolean) {
    if (this.disabled || this.isOpened === show) return;

    const target =
      this.datepickerInput.elementRef.nativeElement.querySelector(
        '.cps-input-wrap'
      );

    if (typeof show === 'boolean') {
      if (show) {
        this.calendarMenu.show({
          target
        });
      } else {
        this.calendarMenu.hide();
      }
    } else {
      this.calendarMenu.toggle({
        target
      });
    }

    this.isOpened = this.calendarMenu.isVisible();

    if (!this.isOpened) {
      this._control?.control?.markAsTouched();
      this._checkErrors();
    } else {
      this.focusInput();
    }
  }
}
