import {
  Component,
  OnInit,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import {
  CpsButtonToggleComponent,
  CpsButtonToggleOption
} from '../cps-button-toggle/cps-button-toggle.component';
import { CpsSelectComponent } from '../cps-select/cps-select.component';
import { CpsRadioGroupComponent } from '../cps-radio-group/cps-radio-group.component';
import { CpsRadioComponent } from '../cps-radio-group/cps-radio/cps-radio.component';
import { CronTimePickerComponent } from './cron-time-picker/cron-time-picker.component';
import { CpsCheckboxComponent } from '../cps-checkbox/cps-checkbox.component';
import { CpsInputComponent } from '../cps-input/cps-input.component';

const Days = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday'
};

const MonthWeeks = {
  '#1': 'First',
  '#2': 'Second',
  '#3': 'Third',
  '#4': 'Fourth',
  '#5': 'Fifth',
  L: 'Last'
};

enum Months {
  January = 1,
  February,
  March,
  April,
  May,
  June,
  July,
  August,
  September,
  October,
  November,
  December
}

/**
 * CpsSchedulingComponent is a component designed to facilitate the creation of CRON expressions.
 * @group Components
 */
@Component({
  selector: 'cps-scheduling',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CpsButtonToggleComponent,
    CpsSelectComponent,
    CpsRadioGroupComponent,
    CpsRadioComponent,
    CpsCheckboxComponent,
    CpsInputComponent,
    CronTimePickerComponent
  ],
  templateUrl: './cps-scheduling.component.html',
  styleUrl: './cps-scheduling.component.scss'
})
export class CpsSchedulingComponent implements OnInit, OnChanges {
  /**
   * Determines whether the component is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Default time format for the component.
   * @group Props
   */
  @Input() defaultTime = '00:00:00';

  /**
   * Determines whether to use 24-hour time format.
   * @group Props
   */
  @Input() use24HourTime = true;

  /**
   * Determines whether to hide the 'Not set' tab.
   * @group Props
   */
  @Input() hideNotSet = false;

  /**
   * Determines whether to hide the 'Advanced' tab.
   * @group Props
   */
  @Input() hideAdvanced = false;

  /**
   * Information tooltip for the component.
   * @group Props
   */
  @Input() infoTooltip = '';

  /**
   * Cron expression.
   * @group Props
   */
  @Input() set cron(value: string) {
    this.localCron = value;
    this.valueChanged.emit(this.localCron);
  }

  get cron(): string {
    return this.localCron;
  }

  activeScheduleType = 'Not set';

  scheduleTypes = [
    { label: 'Not set', value: 'Not set' },
    { label: 'Minutes', value: 'Minutes' },
    { label: 'Hourly', value: 'Hourly' },
    { label: 'Daily', value: 'Daily' },
    { label: 'Weekly', value: 'Weekly' },
    { label: 'Monthly', value: 'Monthly' },
    { label: 'Yearly', value: 'Yearly' },
    { label: 'Advanced', value: 'Advanced' }
  ] as CpsButtonToggleOption[];

  /**
   * Callback to invoke on value change.
   * @param {string} string - value changed.
   * @group Emits
   */
  @Output() valueChanged = new EventEmitter<string>();

  public selectOptions = this.getSelectOptions();
  public state: any;

  private localCron = '';
  private isDirty = false;

  form!: UntypedFormGroup;

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private _fb: UntypedFormBuilder,
    private _cdr: ChangeDetectorRef
  ) {}

  public ngOnInit() {
    if (this.hideNotSet) {
      this.scheduleTypes.shift();
      this.activeScheduleType = 'Minutes';
      this.localCron = '0/1 * 1/1 * ? *';
    }

    if (this.hideAdvanced) {
      this.scheduleTypes.pop();
    }

    this.state = this.getDefaultState();
    this.handleModelChange(this.cron);

    this.form = this._fb.group({
      advanced: [
        this.state.advanced.expression ?? '',
        [this._validateAdvancedExpr]
      ]
    });
  }

  public ngOnChanges(changes: SimpleChanges) {
    const newCron = changes.cron;
    if (newCron && !newCron.firstChange) {
      this.handleModelChange(this.cron);
    }
  }

  private _isValidCron(cron: string): boolean {
    if (typeof cron !== 'string') return false;

    if (this.hideNotSet) {
      if (!cron) return false;
    } else if (cron === '') return true;

    const parts = cron.split(' ');
    if (parts.length !== 6) {
      return false;
    }

    return true;
  }

  private _validateAdvancedExpr(c: FormControl) {
    const cron = c.value;
    if (!cron) return null;

    const splits = cron?.split(' ') || [];
    if (splits.length !== 6) return { invalidExpression: 'Invalid expression' };

    const cronSeven = `0 ${cron}`;

    return cronSeven.match(/\d+ 0\/\d+ \* 1\/1 \* \? \*/) ||
      cronSeven.match(/\d+ \d+ 0\/\d+ 1\/1 \* \? \*/) ||
      cronSeven.match(/\d+ \d+ \d+ 1\/\d+ \* \? \*/) ||
      cronSeven.match(/\d+ \d+ \d+ \? \* MON-FRI \*/) ||
      cronSeven.match(
        /\d+ \d+ \d+ \? \* (MON|TUE|WED|THU|FRI|SAT|SUN)(,(MON|TUE|WED|THU|FRI|SAT|SUN))* \*/
      ) ||
      cronSeven.match(/\d+ \d+ \d+ (\d+|L|LW|1W) 1\/\d+ \? \*/) ||
      cronSeven.match(
        /\d+ \d+ \d+ \? \d+\/\d+ (MON|TUE|WED|THU|FRI|SAT|SUN)((#[1-5])|L) \*/
      ) ||
      cronSeven.match(/\d+ \d+ \d+ (\d+|L|LW|1W) \d+ \? \*/) ||
      cronSeven.match(
        /\d+ \d+ \d+ \? \d+ (MON|TUE|WED|THU|FRI|SAT|SUN)((#[1-5])|L) \*/
      )
      ? null
      : { invalidExpression: 'Invalid expression' };
  }

  public setActiveScheduleType(value: string) {
    if (!this.disabled) {
      this.activeScheduleType = value;
      this.regenerateCron(true);
    }
    if (value && this.form) {
      if (value === 'Advanced') {
        this.form.controls.advanced.addValidators(Validators.required);
        this.form.controls.advanced.updateValueAndValidity();
      } else {
        this.form.controls.advanced.removeValidators(Validators.required);
        this.form.controls.advanced.setErrors(null);
      }
    }
  }

  public regenerateCron(tabChange?: boolean) {
    this.isDirty = true;

    switch (this.activeScheduleType) {
      case 'Minutes':
        this.cron = `0/${this.state.minutes.minutes} * 1/1 * ?`;
        this.cron = `${this.cron} *`;
        break;
      case 'Hourly':
        this.cron = `${this.state.hourly.minutes} 0/${this.state.hourly.hours} 1/1 * ?`;
        this.cron = `${this.cron} *`;
        break;
      case 'Daily':
        switch (this.state.daily.subTab) {
          case 'everyDays':
            // tslint:disable-next-line:max-line-length
            this.cron = `${
              this.state.daily.everyDays.minutes
            } ${this.hourToCron(
              this.state.daily.everyDays.hours,
              this.state.daily.everyDays.hourType
            )} 1/${this.state.daily.everyDays.days} * ?`;
            this.cron = `${this.cron} *`;

            break;
          case 'everyWeekDay':
            // tslint:disable-next-line:max-line-length
            this.cron = `${
              this.state.daily.everyWeekDay.minutes
            } ${this.hourToCron(
              this.state.daily.everyWeekDay.hours,
              this.state.daily.everyWeekDay.hourType
            )} ? * MON-FRI`;
            this.cron = `${this.cron} *`;
            break;
          default:
            throw new Error('Invalid cron daily subtab selection');
        }
        break;
      case 'Weekly': {
        const days = this.selectOptions.days
          .map((d) => d.value)
          .reduce(
            (acc, day) => (this.state.weekly[day] ? acc.concat([day]) : acc),
            [] as string[]
          )
          .join(',');
        this.cron = `${this.state.weekly.minutes} ${this.hourToCron(
          this.state.weekly.hours,
          this.state.weekly.hourType
        )} ? * ${days}`;
        this.cron = `${this.cron} *`;
        break;
      }
      case 'Monthly': {
        switch (this.state.monthly.subTab) {
          case 'specificDay': {
            const day = this.state.monthly.runOnWeekday
              ? `${this.state.monthly.specificDay.day}W`
              : this.state.monthly.specificDay.day;
            // tslint:disable-next-line:max-line-length
            this.cron = `${
              this.state.monthly.specificDay.minutes
            } ${this.hourToCron(
              this.state.monthly.specificDay.hours,
              this.state.monthly.specificDay.hourType
            )} ${day} 1/${this.state.monthly.specificDay.months} ?`;
            this.cron = `${this.cron} *`;
            break;
          }
          case 'specificWeekDay':
            // tslint:disable-next-line:max-line-length
            this.cron = `${
              this.state.monthly.specificWeekDay.minutes
            } ${this.hourToCron(
              this.state.monthly.specificWeekDay.hours,
              this.state.monthly.specificWeekDay.hourType
            )} ? ${this.state.monthly.specificWeekDay.startMonth}/${
              this.state.monthly.specificWeekDay.months
            } ${this.state.monthly.specificWeekDay.day}${
              this.state.monthly.specificWeekDay.monthWeek
            }`;
            this.cron = `${this.cron} *`;
            break;
          default:
            throw new Error('Invalid cron monthly subtab selection');
        }
        break;
      }
      case 'Yearly':
        switch (this.state.yearly.subTab) {
          case 'specificMonthDay': {
            // tslint:disable-next-line:max-line-length
            const day = this.state.yearly.runOnWeekday
              ? `${this.state.yearly.specificMonthDay.day}W`
              : this.state.yearly.specificMonthDay.day;
            // tslint:disable-next-line:max-line-length
            this.cron = `${
              this.state.yearly.specificMonthDay.minutes
            } ${this.hourToCron(
              this.state.yearly.specificMonthDay.hours,
              this.state.yearly.specificMonthDay.hourType
            )} ${day} ${this.state.yearly.specificMonthDay.month} ?`;
            this.cron = `${this.cron} *`;
            break;
          }
          case 'specificMonthWeek':
            // tslint:disable-next-line:max-line-length
            this.cron = `${
              this.state.yearly.specificMonthWeek.minutes
            } ${this.hourToCron(
              this.state.yearly.specificMonthWeek.hours,
              this.state.yearly.specificMonthWeek.hourType
            )} ? ${this.state.yearly.specificMonthWeek.month} ${
              this.state.yearly.specificMonthWeek.day
            }${this.state.yearly.specificMonthWeek.monthWeek}`;
            this.cron = `${this.cron} *`;
            break;
          default:
            throw new Error('Invalid cron yearly subtab selection');
        }
        break;
      case 'Advanced':
        if (!tabChange) this.cron = this.form.value.advanced || '';
        this.form.controls.advanced.setValue(this.cron);
        break;
      default:
        if (!this.hideNotSet) this.cron = '';
        else throw new Error('Invalid cron type');
    }
  }

  private getAmPmHour(hour: number) {
    return this.use24HourTime ? hour : ((hour + 11) % 12) + 1;
  }

  private getHourType(hour: number) {
    return this.use24HourTime ? undefined : hour >= 12 ? 'PM' : 'AM';
  }

  private hourToCron(hour: number, hourType: string) {
    if (this.use24HourTime) {
      return hour;
    } else {
      return hourType === 'AM'
        ? hour === 12
          ? 0
          : hour
        : hour === 12
          ? 12
          : hour + 12;
    }
  }

  private handleModelChange(cron: string) {
    if (!this._isValidCron(cron)) {
      console.error('Invalid cron value:', cron);
      this.cron = this.hideNotSet ? '0/1 * 1/1 * ? *' : '';
      return;
    }

    if (this.isDirty) {
      this.isDirty = false;
      return;
    } else {
      this.isDirty = false;
    }

    const emptyCron = cron?.length < 1;

    const cronSeven = `0 ${cron}`;

    const [seconds, minutes, hours, dayOfMonth, month, dayOfWeek] =
      cronSeven.split(' ');

    if (emptyCron) {
      this.activeScheduleType = 'Not set';
    } else if (cronSeven.match(/\d+ 0\/\d+ \* 1\/1 \* \? \*/)) {
      this.activeScheduleType = 'Minutes';

      this.state.minutes.minutes = Number(minutes.substring(2));
      this.state.minutes.seconds = Number(seconds);
    } else if (cronSeven.match(/\d+ \d+ 0\/\d+ 1\/1 \* \? \*/)) {
      this.activeScheduleType = 'Hourly';

      this.state.hourly.hours = Number(hours.substring(2));
      this.state.hourly.minutes = Number(minutes);
      this.state.hourly.seconds = Number(seconds);
    } else if (cronSeven.match(/\d+ \d+ \d+ 1\/\d+ \* \? \*/)) {
      this.activeScheduleType = 'Daily';

      this.state.daily.subTab = 'everyDays';
      this.state.daily.everyDays.days = Number(dayOfMonth.substring(2));
      const parsedHours = Number(hours);
      this.state.daily.everyDays.hours = this.getAmPmHour(parsedHours);
      this.state.daily.everyDays.hourType = this.getHourType(parsedHours);
      this.state.daily.everyDays.minutes = Number(minutes);
      this.state.daily.everyDays.seconds = Number(seconds);
    } else if (cronSeven.match(/\d+ \d+ \d+ \? \* MON-FRI \*/)) {
      this.activeScheduleType = 'Daily';

      this.state.daily.subTab = 'everyWeekDay';
      const parsedHours = Number(hours);
      this.state.daily.everyWeekDay.hours = this.getAmPmHour(parsedHours);
      this.state.daily.everyWeekDay.hourType = this.getHourType(parsedHours);
      this.state.daily.everyWeekDay.minutes = Number(minutes);
      this.state.daily.everyWeekDay.seconds = Number(seconds);
    } else if (
      cronSeven.match(
        /\d+ \d+ \d+ \? \* (MON|TUE|WED|THU|FRI|SAT|SUN)(,(MON|TUE|WED|THU|FRI|SAT|SUN))* \*/
      )
    ) {
      this.activeScheduleType = 'Weekly';
      this.selectOptions.days
        .map((d) => d.value)
        .forEach((weekDay) => (this.state.weekly[weekDay] = false));
      dayOfWeek
        .split(',')
        .forEach((weekDay) => (this.state.weekly[weekDay] = true));
      const parsedHours = Number(hours);
      this.state.weekly.hours = this.getAmPmHour(parsedHours);
      this.state.weekly.hourType = this.getHourType(parsedHours);
      this.state.weekly.minutes = Number(minutes);
      this.state.weekly.seconds = Number(seconds);
    } else if (cronSeven.match(/\d+ \d+ \d+ (\d+|L|LW|1W) 1\/\d+ \? \*/)) {
      this.activeScheduleType = 'Monthly';
      this.state.monthly.subTab = 'specificDay';

      if (dayOfMonth.indexOf('W') !== -1) {
        this.state.monthly.specificDay.day = dayOfMonth.charAt(0);
        this.state.monthly.runOnWeekday = true;
      } else {
        this.state.monthly.specificDay.day = dayOfMonth;
      }

      this.state.monthly.specificDay.months = Number(month.substring(2));
      const parsedHours = Number(hours);
      this.state.monthly.specificDay.hours = this.getAmPmHour(parsedHours);
      this.state.monthly.specificDay.hourType = this.getHourType(parsedHours);
      this.state.monthly.specificDay.minutes = Number(minutes);
      this.state.monthly.specificDay.seconds = Number(seconds);
    } else if (
      cronSeven.match(
        /\d+ \d+ \d+ \? \d+\/\d+ (MON|TUE|WED|THU|FRI|SAT|SUN)((#[1-5])|L) \*/
      )
    ) {
      const day = dayOfWeek.substring(0, 3);
      const monthWeek = dayOfWeek.substring(3);
      this.activeScheduleType = 'Monthly';
      this.state.monthly.subTab = 'specificWeekDay';
      this.state.monthly.specificWeekDay.monthWeek = monthWeek;
      this.state.monthly.specificWeekDay.day = day;

      if (month.indexOf('/') !== -1) {
        const [startMonth, months] = month.split('/').map(Number);
        this.state.monthly.specificWeekDay.months = months;
        this.state.monthly.specificWeekDay.startMonth = startMonth;
      }

      const parsedHours = Number(hours);
      this.state.monthly.specificWeekDay.hours = this.getAmPmHour(parsedHours);
      this.state.monthly.specificWeekDay.hourType =
        this.getHourType(parsedHours);
      this.state.monthly.specificWeekDay.minutes = Number(minutes);
      this.state.monthly.specificWeekDay.seconds = Number(seconds);
    } else if (cronSeven.match(/\d+ \d+ \d+ (\d+|L|LW|1W) \d+ \? \*/)) {
      this.activeScheduleType = 'Yearly';
      this.state.yearly.subTab = 'specificMonthDay';
      this.state.yearly.specificMonthDay.month = Number(month);

      if (dayOfMonth.indexOf('W') !== -1) {
        this.state.yearly.specificMonthDay.day = dayOfMonth.charAt(0);
        this.state.yearly.runOnWeekday = true;
      } else {
        this.state.yearly.specificMonthDay.day = dayOfMonth;
      }

      const parsedHours = Number(hours);
      this.state.yearly.specificMonthDay.hours = this.getAmPmHour(parsedHours);
      this.state.yearly.specificMonthDay.hourType =
        this.getHourType(parsedHours);
      this.state.yearly.specificMonthDay.minutes = Number(minutes);
      this.state.yearly.specificMonthDay.seconds = Number(seconds);
    } else if (
      cronSeven.match(
        /\d+ \d+ \d+ \? \d+ (MON|TUE|WED|THU|FRI|SAT|SUN)((#[1-5])|L) \*/
      )
    ) {
      const day = dayOfWeek.substring(0, 3);
      const monthWeek = dayOfWeek.substring(3);
      this.activeScheduleType = 'Yearly';
      this.state.yearly.subTab = 'specificMonthWeek';
      this.state.yearly.specificMonthWeek.monthWeek = monthWeek;
      this.state.yearly.specificMonthWeek.day = day;
      this.state.yearly.specificMonthWeek.month = Number(month);
      const parsedHours = Number(hours);
      this.state.yearly.specificMonthWeek.hours = this.getAmPmHour(parsedHours);
      this.state.yearly.specificMonthWeek.hourType =
        this.getHourType(parsedHours);
      this.state.yearly.specificMonthWeek.minutes = Number(minutes);
      this.state.yearly.specificMonthWeek.seconds = Number(seconds);
    } else {
      this.activeScheduleType = 'Advanced';
      this.form.controls.advanced.setValue(cron);
    }
    this._cdr.detectChanges();
  }

  private getDefaultState() {
    const [defaultHours, defaultMinutes, defaultSeconds] = this.defaultTime
      .split(':')
      .map(Number);

    return {
      minutes: {
        minutes: 1,
        seconds: 0
      },
      hourly: {
        hours: 1,
        minutes: 0,
        seconds: 0
      },
      daily: {
        subTab: 'everyDays',
        everyDays: {
          days: 1,
          hours: this.getAmPmHour(defaultHours),
          minutes: defaultMinutes,
          seconds: defaultSeconds,
          hourType: this.getHourType(defaultHours)
        },
        everyWeekDay: {
          hours: this.getAmPmHour(defaultHours),
          minutes: defaultMinutes,
          seconds: defaultSeconds,
          hourType: this.getHourType(defaultHours)
        }
      },
      weekly: {
        MON: true,
        TUE: false,
        WED: false,
        THU: false,
        FRI: false,
        SAT: false,
        SUN: false,
        hours: this.getAmPmHour(defaultHours),
        minutes: defaultMinutes,
        seconds: defaultSeconds,
        hourType: this.getHourType(defaultHours)
      },
      monthly: {
        subTab: 'specificDay',
        runOnWeekday: false,
        specificDay: {
          day: '1',
          months: 1,
          hours: this.getAmPmHour(defaultHours),
          minutes: defaultMinutes,
          seconds: defaultSeconds,
          hourType: this.getHourType(defaultHours)
        },
        specificWeekDay: {
          monthWeek: '#1',
          day: 'MON',
          startMonth: 1,
          months: 1,
          hours: this.getAmPmHour(defaultHours),
          minutes: defaultMinutes,
          seconds: defaultSeconds,
          hourType: this.getHourType(defaultHours)
        }
      },
      yearly: {
        subTab: 'specificMonthDay',
        runOnWeekday: false,
        specificMonthDay: {
          month: 1,
          day: '1',
          hours: this.getAmPmHour(defaultHours),
          minutes: defaultMinutes,
          seconds: defaultSeconds,
          hourType: this.getHourType(defaultHours)
        },
        specificMonthWeek: {
          monthWeek: '#1',
          day: 'MON',
          month: 1,
          hours: this.getAmPmHour(defaultHours),
          minutes: defaultMinutes,
          seconds: defaultSeconds,
          hourType: this.getHourType(defaultHours)
        }
      },
      advanced: {
        expression: this.cron
      }
    };
  }

  private _getRange(startFrom: number, until: number) {
    return Array.from(
      { length: until + 1 - startFrom },
      (_, k) => k + startFrom
    );
  }

  private getSelectOptions() {
    return {
      monthsNumeric: this._getRange(1, 12).map((month) => ({
        label: month,
        value: month
      })),
      months: this._getRange(1, 12).map((month) => ({
        label: Months[month],
        value: month
      })),
      monthWeeks: Object.entries(MonthWeeks).map(([key, value]) => ({
        label: value,
        value: key
      })),
      days: Object.entries(Days).map(([key, value]) => ({
        label: value,
        value: key
      })),
      minutes: this._getRange(0, 59).map((min) => ({
        label: min,
        value: min
      })),
      fullMinutes: this._getRange(0, 59).map((min) => ({
        label: min,
        value: min
      })),
      hours: this._getRange(1, 23).map((hour) => ({
        label: hour,
        value: hour
      })),
      monthDays: this._getRange(1, 31).map((day) => ({
        label: day,
        value: day
      })),
      monthDaysWithLasts: [...this._getRange(1, 31).map(String), 'L'].map(
        (mdl) => {
          return {
            label: this._getMonthDayLabel(mdl),
            value: mdl
          };
        }
      )
    };
  }

  private _getMonthDayLabel(month: string): string {
    if (month === 'L') {
      return 'Last Day';
    } else if (month === 'LW') {
      return 'Last Weekday';
    } else if (month === '1W') {
      return 'First Weekday';
    } else {
      let suffix = '';
      if (month.length > 1) {
        const secondToLastDigit = month.charAt(month.length - 2);
        if (secondToLastDigit === '1') {
          suffix = 'th';
        }
      }
      if (!suffix) {
        const lastDigit = month.charAt(month.length - 1);
        switch (lastDigit) {
          case '1':
            suffix = 'st';
            break;
          case '2':
            suffix = 'nd';
            break;
          case '3':
            suffix = 'rd';
            break;
          default:
            suffix = 'th';
            break;
        }
      }

      return `${month}${suffix} day`;
    }
  }
}
