import {
  AfterViewInit,
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
import { CommonModule } from '@angular/common';
import { FormsModule, NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  CpsButtonToggleComponent,
  CpsButtonToggleOption
} from '../cps-button-toggle/cps-button-toggle.component';
import { CpsAutocompleteComponent } from '../cps-autocomplete/cps-autocomplete.component';
import { CpsTooltipPosition } from '../../directives/cps-tooltip/cps-tooltip.directive';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';

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
    CpsAutocompleteComponent,
    CpsInfoCircleComponent
  ],
  templateUrl: './cps-timepicker.component.html',
  styleUrls: ['./cps-timepicker.component.scss']
})
export class CpsTimepickerComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  /**
   * Label of the timepicker.
   * @group Props
   */
  @Input() label = '';

  /**
   * Determines whether the timepicker is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Determines whether the timepicker uses 24-hour format.
   * @group Props
   */
  @Input() use24HourTime = false;

  /**
   * Determines whether the timepicker has seconds.
   * @group Props
   */
  @Input() withSeconds = false;

  /**
   * Bottom hint text for the timepicker.
   * @group Props
   */
  @Input() hint = '';

  /**
   * Hides hint and validation errors.
   * @group Props
   */
  @Input() hideDetails = false;

  /**
   * When it is not an empty string, an info icon is displayed to show text for more info.
   * @group Props
   */
  @Input() infoTooltip = '';

  /**
   * InfoTooltip class for styling.
   * @group Props
   */
  @Input() infoTooltipClass = 'cps-tooltip-content';

  /**
   * Max width of infoTooltip, of type number denoting pixels or string.
   * @group Props
   */
  @Input() infoTooltipMaxWidth: number | string = '100%';

  /**
   * Determines whether the infoTooltip is persistent.
   * @group Props
   */
  @Input() infoTooltipPersistent = false;

  /**
   * Position of infoTooltip, it can be 'top', 'bottom', 'left' or 'right'.
   * @group Props
   */
  @Input() infoTooltipPosition: CpsTooltipPosition = 'top';

  /**
   * Determines whether the timepicker input fields can be cleared.
   * @group Props
   */
  @Input() mandatoryValue = false;

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
  @Output() valueChanged = new EventEmitter<CpsTime>();

  @ViewChild('hoursField')
  hoursField!: CpsAutocompleteComponent;

  @ViewChild('minutesField')
  minutesField!: CpsAutocompleteComponent;

  @ViewChild('secondsField')
  secondsField?: CpsAutocompleteComponent;

  dayPeriodOptions: CpsButtonToggleOption[] = [
    { label: 'AM', value: 'AM' },
    { label: 'PM', value: 'PM' }
  ];

  hoursOptions: { label: string; value: string }[] = [];

  minutesOptions = this._getRange(0, 59).map((m) => ({
    value: m.toString().padStart(2, '0'),
    label: m.toString().padStart(2, '0')
  }));

  secondsOptions: { label: string; value: string }[] = [];

  private _statusChangesSubscription?: Subscription;

  error = '';
  hoursError = '';
  minutesError = '';
  secondsError = '';

  private _value: CpsTime | undefined = undefined;

  constructor(@Self() @Optional() private _control: NgControl) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this._initHoursOptions();

    if (this.withSeconds) {
      this.secondsOptions = this._getRange(0, 59).map((m) => ({
        value: m.toString().padStart(2, '0'),
        label: m.toString().padStart(2, '0')
      }));
    }

    this._statusChangesSubscription = this._control?.statusChanges?.subscribe(
      () => {
        this._checkErrors();
      }
    );
  }

  ngAfterViewInit(): void {
    if (this.hoursField) this.hoursField.isTimePickerField = true;
    if (this.minutesField) this.minutesField.isTimePickerField = true;
    if (this.secondsField) this.secondsField.isTimePickerField = true;
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

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}

  writeValue(value: CpsTime) {
    this.value = value;
  }

  onFieldBlur() {
    this._control?.control?.markAsTouched();
    this._checkErrors();
  }

  updateHours(hours: string) {
    const userInput = this.hoursField?.inputText || hours || '';
    if (userInput) {
      this._initValue();
      const h = parseInt(userInput, 10);
      if (!isNaN(h) && this.value) {
        if (h >= 13 && h <= 23 && !this.use24HourTime) {
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
    minutes = minutes || '';
    if (minutes) this._initValue();
    if (this.value?.minutes !== minutes) {
      if (this.value) this.value.minutes = minutes;
    }
    this._tryUpdateValue();
  }

  updateSeconds(seconds: string) {
    seconds = seconds || '';
    if (seconds) this._initValue();
    if (this.value?.seconds !== seconds) {
      if (this.value) this.value.seconds = seconds;
    }
    this._tryUpdateValue();
  }

  updateDayPeriod(dayPeriod: 'AM' | 'PM') {
    if (dayPeriod) this._initValue();
    if (this.value?.dayPeriod !== dayPeriod) {
      if (this.value) this.value.dayPeriod = dayPeriod;
    }
    this._tryUpdateValue();
  }

  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  private _initValue() {
    if (!this.value) {
      this.value = {
        hours: '',
        minutes: ''
      };
    }
    if (!this.use24HourTime && !('dayPeriod' in this.value)) {
      this.value.dayPeriod = 'AM';
    }
    if (this.withSeconds && !('seconds' in this.value)) {
      this.value.seconds = '';
    }
  }

  private _isValueValid() {
    if (!this.value) return false;
    if (!this.value.hours || !this.value.minutes) return false;
    if (this.withSeconds && !this.value.seconds) return false;
    if (!this.use24HourTime && !this.value.dayPeriod) return false;
    return true;
  }

  private _updateErrors() {
    this.error = 'Time is invalid';
    this.hoursError = this.value?.hours ? '' : this.error;
    this.minutesError = this.value?.minutes ? '' : this.error;
    if (this.withSeconds)
      this.secondsError = this.value?.seconds ? '' : this.error;
  }

  private _setErrors(error: string) {
    this.error = error;
    this.hoursError = error;
    this.minutesError = error;
    this.secondsError = this.withSeconds ? error : '';
  }

  private _checkErrors() {
    if (!this._control) return;

    if (this.value && !this._isValueValid()) {
      this._updateErrors();
      return;
    }

    const errors = this._control?.errors;

    if (!this._control?.control?.touched || !errors) {
      this._setErrors('');
      return;
    }

    if ('required' in errors) {
      this._setErrors('Field is required');
      return;
    }

    const errArr = Object.values(errors);
    if (errArr.length < 1) {
      this._setErrors('');
      return;
    }
    const message = errArr.find((msg) => typeof msg === 'string');

    this._setErrors(message || 'Unknown error');
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

  private _updateValue(value: CpsTime) {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  private _tryUpdateValue() {
    if (
      this.value?.hours &&
      this.value?.minutes &&
      (!this.withSeconds || (this.withSeconds && this.value?.seconds)) &&
      (this.use24HourTime || (!this.use24HourTime && this.value?.dayPeriod))
    )
      this._updateValue(this.value);
  }

  private _getRange(startFrom: number, until: number) {
    return Array.from(
      { length: until + 1 - startFrom },
      (_, k) => k + startFrom
    );
  }
}
