import {
  AfterViewInit,
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

export interface CpsTime {
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
export class CpsTimepickerComponent implements OnInit, AfterViewInit {
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
  @Input() use24HourTime = false;

  /**
   * Whether the timepicker has seconds.
   * @group Props
   */
  @Input() withSeconds = true;

  /**
   * Value of the timepicker.
   * @group Props
   */
  @Input() set value(value: CpsTime | undefined) {
    if (!value) value = undefined;
    this._value = value;
    this.onChange(value);
  }

  get value(): CpsTime | undefined {
    return this._value;
  }

  /**
   * Callback to invoke on value change.
   * @param {string} string - value changed.
   * @group Emits
   */
  @Output() valueChanged = new EventEmitter<CpsTime | undefined>();

  @ViewChild('hoursField')
  hoursField!: CpsAutocompleteComponent;

  @ViewChild('minutesField')
  minutesField!: CpsAutocompleteComponent;

  @ViewChild('secondsField')
  secondsField?: CpsAutocompleteComponent;

  private _value: CpsTime | undefined = undefined;

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

    this._initHoursOptions();

    if (this.withSeconds) {
      this.secondsOptions = this._getRange(0, 59).map((m) => ({
        value: m.toString().padStart(2, '0'),
        label: m.toString().padStart(2, '0')
      }));
    }
  }

  ngAfterViewInit(): void {
    if (this.hoursField) this.hoursField.isTimePickerField = true;
    if (this.minutesField) this.minutesField.isTimePickerField = true;
    if (this.secondsField) this.secondsField.isTimePickerField = true;
  }

  private _initHoursOptions() {
    const getHourAlias = (h: number) => {
      h = h === 12 ? 0 : h + 12;
      return h.toString().padStart(2, '0');
    };

    this.hoursOptions = (
      this.use24HourTime ? this._getRange(0, 23) : this._getRange(1, 12)
    ).map((h) => {
      const res: { value: string; label: string; alias?: string } = {
        value: h.toString().padStart(2, '0'),
        label: h.toString().padStart(2, '0')
      };
      if (!this.use24HourTime) res.alias = getHourAlias(h);
      return res;
    });
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

  writeValue(value: CpsTime | undefined) {
    this.value = value;
  }

  private _updateValue(value: CpsTime | undefined) {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  updateHours(hours: string) {
    const userInput = this.hoursField?.inputText || hours;
    if (userInput) {
      const h = parseInt(userInput, 10);
      if (!isNaN(h) && this.value) {
        const isPM = h >= 13 && h <= 23;
        if (this.use24HourTime) this.value.dayPeriod = isPM ? 'PM' : 'AM';
        else if (isPM) {
          this.value.dayPeriod = 'PM';
        }
      }
    }

    if (this.value?.hours !== hours) {
      if (this.value) this.value.hours = hours;
    }
    this._tryUpdateValue();
  }

  updateMinutes(minutes: string) {
    if (this.value?.minutes !== minutes) {
      if (this.value) this.value.minutes = minutes;
    }
    this._tryUpdateValue();
  }

  updateSeconds(seconds: string) {
    if (this.value?.seconds !== seconds) {
      if (this.value) this.value.seconds = seconds;
    }
    this._tryUpdateValue();
  }

  updateDayPeriod(dayPeriod: 'AM' | 'PM') {
    if (this.value?.dayPeriod !== dayPeriod) {
      if (this.value) this.value.dayPeriod = dayPeriod;
    }
    this._tryUpdateValue();
  }

  private _tryUpdateValue() {
    if (this.value?.hours && this.value?.minutes && this.value?.dayPeriod) {
      if (!this.withSeconds || (this.withSeconds && this.value?.seconds))
        this._updateValue(this.value);
    }
  }

  // TODOS:
  // NEED SUPPORT FOR ERRORS
  // NEED TO FIGURE OUT HOW TO EMIT VALUE
  // NEED TO FIGURE OUT THE INITIAL TIME OBJECT STATE (IF IT'S UNDEFINED)
  // NEED TO CHECK HOW 24H FORMAT WORKS

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}

  // onBlur(): void {
  //   let hours = this.value?.hours || '';
  //   let minutes = this.value?.minutes || '';
  //   let dayPeriod = this.value?.dayPeriod || 'AM';

  //   if (hours.length === 1) {
  //     if (hours === '0') {
  //       hours = '12';
  //       dayPeriod = 'AM';
  //     } else hours = '0' + hours;
  //   }

  //   if (+minutes === 0 || +minutes > 59) {
  //     minutes = '00';
  //   }

  //   this._resetValue({ hours, minutes, dayPeriod });
  //   this._updateValue(this.value);
  // }

  // private _resetValue(event: CpsTime | undefined) {
  //   this.value = {
  //     hours: '',
  //     minutes: '',
  //     dayPeriod: 'AM'
  //   };
  //   this.cdRef.detectChanges();
  //   this.value = event;
  // }

  private _getRange(startFrom: number, until: number) {
    return Array.from(
      { length: until + 1 - startFrom },
      (_, k) => k + startFrom
    );
  }

  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  // hasError(): boolean {
  //   return !!this._control?.control?.touched && !!this._control.errors;
  // }
}
