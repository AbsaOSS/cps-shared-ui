import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Optional,
  Output,
  Self,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgControl } from '@angular/forms';
import {
  CpsButtonToggleComponent,
  CpsButtonToggleOption
} from '../cps-button-toggle/cps-button-toggle.component';
import { CpsAutocompleteComponent } from '../cps-autocomplete/cps-autocomplete.component';

interface Time {
  hours: string;
  minutes: string;
  seconds?: string;
  dayPeriod?: 'AM' | 'PM';
}

/**
 * CpsTimepickerComponent allows to pick a specific time from a set of available options or input it manually.
 * @group Components
 */
@Component({
  selector: 'cps-timepicker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CpsButtonToggleComponent,
    CpsAutocompleteComponent
  ],
  templateUrl: './cps-timepicker.component.html',
  styleUrls: ['./cps-timepicker.component.scss']
})
export class CpsTimepickerComponent implements OnInit {
  dayPeriodOptions = [
    { label: 'AM', value: 'AM' },
    { label: 'PM', value: 'PM' }
  ] as CpsButtonToggleOption[];

  hoursOptions: { label: string; value: string }[] = [];

  minutesOptions = this._getRange(0, 59).map((m) => ({
    value: m.toString().padStart(2, '0'),
    label: m.toString().padStart(2, '0')
  }));

  secondsOptions: { label: string; value: string }[] = [];

  /**
   * Label of the timepicker.
   * @group Props
   */
  @Input() label = '';

  /**
   * Whether the timepicker is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Whether the timepicker uses 24-hour format.
   * @group Props
   */
  @Input() use24HourTime = true;

  /**
   * Whether the timepicker has seconds.
   * @group Props
   */
  @Input() withSeconds = true;

  /**
   * Value of the timepicker.
   * @group Props
   */
  @Input() set value(value: Time | undefined) {
    if (!value) value = undefined;
    this._value = value;
    this.onChange(value);
  }

  get value(): Time | undefined {
    return this._value;
  }

  /**
   * Callback to invoke on value change.
   * @param {string} string - value changed.
   * @group Emits
   */
  @Output() valueChanged = new EventEmitter<Time | undefined>();

  @ViewChild('hoursField')
  hoursField!: CpsAutocompleteComponent;

  @ViewChild('minutesField')
  minutesField!: CpsAutocompleteComponent;

  @ViewChild('secondsField')
  secondsField?: CpsAutocompleteComponent;

  private _value: Time | undefined = undefined;

  constructor(
    @Self() @Optional() private _control: NgControl,
    private cdRef: ChangeDetectorRef
  ) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    if (!this.value)
      this.value = {
        hours: '',
        minutes: '',
        dayPeriod: 'AM'
      };

    this.hoursOptions = (
      this.use24HourTime ? this._getRange(0, 23) : this._getRange(0, 12)
    ).map((h) => ({
      value: h.toString().padStart(2, '0'),
      label: h.toString().padStart(2, '0')
    }));

    if (this.withSeconds) {
      this.secondsOptions = this._getRange(0, 59).map((m) => ({
        value: m.toString().padStart(2, '0'),
        label: m.toString().padStart(2, '0')
      }));
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

  writeValue(value: Time | undefined) {
    this.value = value;
  }

  private _updateValue(value: Time | undefined) {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  updateHours(hours: string) {
    const event = {
      hours,
      minutes: this.value?.minutes || '',
      seconds: this.value?.seconds || '',
      dayPeriod: this.value?.dayPeriod || 'AM'
    };

    const numReg = /^\d+$/;
    if (!numReg.test(event.hours)) {
      event.hours = this.value?.hours || '';
      this.resetValue(event);
      this.hoursField?.updateInputText(this.value?.seconds || '');
      return;
    }

    if (event.hours.length > 3) {
      event.hours = event.hours.substring(0, 3);
    }

    if (event.hours.length === 1 && +event.hours >= 1 && +event.hours <= 9) {
      event.hours = '0' + event.hours;
    }

    if (event.hours.length === 3 && event.hours[0] === '0') {
      event.hours = event.hours.substring(1);
      this.resetValue(event);
    }

    if (event.hours.length > 2) {
      event.hours = event.hours.substring(1);
    }

    if (event.hours === '00' || event.hours === '24') {
      event.hours = '12';
      event.dayPeriod = 'AM';
    }

    if (+event.hours > 12) {
      if (+event.hours <= 23) {
        let hours = '' + (+event.hours - 12);
        if (hours.length === 1) {
          hours = '0' + hours;
        }
        event.hours = hours;
        event.dayPeriod = 'PM';
      } else event.hours = '0' + event.hours[event.hours.length - 1];
    }

    if (event.hours?.length === 2) {
      this._updateValue(event);
      this.hoursField.updateInputText(this.value?.hours || '');
    }
  }

  updateMinutes(minutes: string) {
    const event = {
      hours: this.value?.hours || '',
      minutes,
      seconds: this.value?.seconds || '',
      dayPeriod: this.value?.dayPeriod || 'AM'
    };

    const numReg = /^\d+$/;
    if (!numReg.test(event.minutes)) {
      event.minutes = this.value?.minutes || '';
      this.resetValue(event);
      this.minutesField?.updateInputText(this.value?.seconds || '');
      return;
    }

    if (event.minutes.length > 3) {
      event.minutes = event.minutes.substring(0, 3);
    }

    if (
      event.minutes.length === 1 &&
      +event.minutes >= 0 &&
      +event.minutes <= 9
    ) {
      event.minutes = '0' + event.minutes;
    }

    if (event.minutes.length === 3 && event.minutes[0] === '0') {
      event.minutes = event.minutes.substring(1);
      this.resetValue(event);
    }

    if (event.minutes.length > 2) {
      event.minutes = event.minutes.substring(1);
    }

    if (+event.minutes > 59) {
      event.minutes = '0' + event.minutes[event.minutes.length - 1];
    }

    if (event.minutes?.length === 2) {
      this._updateValue(event);
      this.minutesField.updateInputText(this.value?.minutes || '');
    }
  }

  updateSeconds(seconds: string) {
    const event = {
      hours: this.value?.hours || '',
      minutes: this.value?.minutes || '',
      seconds,
      dayPeriod: this.value?.dayPeriod || 'AM'
    };

    const numReg = /^\d+$/;
    if (!numReg.test(event.seconds)) {
      event.seconds = this.value?.seconds || '';
      this.resetValue(event);
      this.secondsField?.updateInputText(this.value?.seconds || '');
      return;
    }

    if (event.seconds.length > 3) {
      event.seconds = event.seconds.substring(0, 3);
    }

    if (
      event.seconds.length === 1 &&
      +event.seconds >= 0 &&
      +event.seconds <= 9
    ) {
      event.seconds = '0' + event.seconds;
    }

    if (event.seconds.length === 3 && event.seconds[0] === '0') {
      event.seconds = event.seconds.substring(1);
      this.resetValue(event);
    }

    if (event.seconds.length > 2) {
      event.seconds = event.seconds.substring(1);
    }

    if (+event.seconds > 59) {
      event.seconds = '0' + event.seconds[event.seconds.length - 1];
    }

    if (event.seconds?.length === 2) {
      this._updateValue(event);
      this.secondsField?.updateInputText(this.value?.seconds || '');
    }
  }

  updateDayPeriod(dayPeriod: 'AM' | 'PM') {
    this._updateValue({
      hours: this.value?.hours || '',
      minutes: this.value?.minutes || '',
      seconds: this.value?.seconds || '',
      dayPeriod
    });
  }

  updateValueInternal(event: Time | undefined) {
    // if (!event?.hours || !event?.minutes) {
    //   this.value = event;
    //   return;
    // }

    if (!event) return;

    const numReg = /^\d+$/;
    if (!numReg.test(event.hours)) {
      event.hours = this.value?.hours || '';
      this.resetValue(event);
      return;
    }

    if (event.hours.length > 3) {
      event.hours = event.hours.substring(0, 3);
    }

    if (event.hours.length === 1 && +event.hours >= 1 && +event.hours <= 9) {
      event.hours = '0' + event.hours;
    }

    if (event.hours.length === 3 && event.hours[0] === '0') {
      event.hours = event.hours.substring(1);
      this.resetValue(event);
    }

    if (event.hours.length > 2) {
      event.hours = event.hours.substring(1);
    }

    if (event.hours === '00' || event.hours === '24') {
      event.hours = '12';
      event.dayPeriod = 'AM';
    }

    if (+event.hours > 12) {
      if (+event.hours <= 23) {
        let hours = '' + (+event.hours - 12);
        if (hours.length === 1) {
          hours = '0' + hours;
        }
        event.hours = hours;
        event.dayPeriod = 'PM';
      } else event.hours = '0' + event.hours[event.hours.length - 1];
    }

    if (!numReg.test(event.minutes)) {
      event.minutes = this.value?.minutes || '';
      this.resetValue(event);
      return;
    }

    if (event.minutes.length > 3) {
      event.minutes = event.minutes.substring(0, 3);
    }

    if (
      event.minutes.length === 1 &&
      +event.minutes >= 0 &&
      +event.minutes <= 9
    ) {
      event.minutes = '0' + event.minutes;
    }

    if (event.minutes.length === 3 && event.minutes[0] === '0') {
      event.minutes = event.minutes.substring(1);
      this.resetValue(event);
    }

    if (event.minutes.length > 2) {
      event.minutes = event.minutes.substring(1);
    }

    if (+event.minutes > 59) {
      event.minutes = '0' + event.minutes[event.minutes.length - 1];
    }

    this._updateValue(event);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}

  onBlur(): void {
    let hours = this.value?.hours || '';
    let minutes = this.value?.minutes || '';
    let dayPeriod = this.value?.dayPeriod || 'AM';

    if (hours.length === 1) {
      if (hours === '0') {
        hours = '12';
        dayPeriod = 'AM';
      } else hours = '0' + hours;
    }

    if (+minutes === 0 || +minutes > 59) {
      minutes = '00';
    }

    this.resetValue({ hours, minutes, dayPeriod });
    this._updateValue(this.value);
  }

  private resetValue(event: Time | undefined) {
    this.value = {
      hours: '',
      minutes: '',
      dayPeriod: 'AM'
    };
    this.cdRef.detectChanges();
    this.value = event;
  }

  private _getRange(startFrom: number, until: number) {
    return Array.from(
      { length: until + 1 - startFrom },
      (_, k) => k + startFrom
    );
  }

  // hasError(): boolean {
  //   return !!this._control?.control?.touched && !!this._control.errors;
  // }
}
