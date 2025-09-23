import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CpsSchedulerComponent } from './cps-scheduler.component';

// Mock the timeZones import
jest.mock('./cps-scheduler.utils', () => ({
  timeZones: ['UTC', 'America/New_York', 'Europe/London']
}));

describe('CpsSchedulerComponent', () => {
  let component: CpsSchedulerComponent;
  let fixture: ComponentFixture<CpsSchedulerComponent>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CpsSchedulerComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CpsSchedulerComponent);
    component = fixture.componentInstance;

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Set default inputs
    component.cron = '';
    component.showNotSet = true;
    component.showAdvanced = true;
    component.showMinutes = true;
    component.use24HourTime = true;

    fixture.detectChanges();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.activeScheduleType).toBe('Not set');
    expect(component.cron).toBe('');
    expect(component.state).toBeDefined();
  });

  describe('Component initialization', () => {
    it('should set up schedule types correctly when all options are enabled', () => {
      component.showNotSet = true;
      component.showAdvanced = true;
      component.showMinutes = true;
      component.ngOnInit();

      expect(component.scheduleTypes).toEqual([
        { label: 'Not set', value: 'Not set' },
        { label: 'Minutes', value: 'Minutes' },
        { label: 'Hourly', value: 'Hourly' },
        { label: 'Daily', value: 'Daily' },
        { label: 'Weekly', value: 'Weekly' },
        { label: 'Monthly', value: 'Monthly' },
        { label: 'Yearly', value: 'Yearly' },
        { label: 'Advanced', value: 'Advanced' }
      ]);
    });

    it('should remove Advanced option when showAdvanced is false', () => {
      component.showAdvanced = false;
      component.ngOnInit();

      const hasAdvanced = component.scheduleTypes.some(
        (type) => type.value === 'Advanced'
      );
      expect(hasAdvanced).toBe(false);
    });

    it('should remove Minutes option when showMinutes is false', () => {
      component.showMinutes = false;
      component.ngOnInit();

      const hasMinutes = component.scheduleTypes.some(
        (type) => type.value === 'Minutes'
      );
      expect(hasMinutes).toBe(false);
    });

    it('should remove Not set option and set default when showNotSet is false', () => {
      component.showNotSet = false;
      component.cron = '';
      component.ngOnInit();

      const hasNotSet = component.scheduleTypes.some(
        (type) => type.value === 'Not set'
      );
      expect(hasNotSet).toBe(false);
      expect(component.cron).toBe('0/1 * 1/1 * ? *');
    });
  });

  describe('_handleModelChange method', () => {
    beforeEach(() => {
      // Reset isDirty flag before each test
      (component as any)._isDirty = false;
    });

    describe('Invalid cron expressions', () => {
      it('should handle non-string cron values', () => {
        (component as any)._handleModelChange(null);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Invalid cron value:',
          null
        );
        expect(component.cron).toBe('');
      });

      it('should handle empty cron when showNotSet is false', () => {
        component.showNotSet = false;
        (component as any)._handleModelChange('');

        expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid cron value:', '');
        expect(component.cron).toBe('0/1 * 1/1 * ? *');
      });

      it('should handle cron with wrong number of parts', () => {
        (component as any)._handleModelChange('0 1 2');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Invalid cron value:',
          '0 1 2'
        );
        expect(component.cron).toBe('');
      });

      it('should allow empty cron when showNotSet is true', () => {
        component.showNotSet = true;
        (component as any)._handleModelChange('');

        expect(component.activeScheduleType).toBe('Not set');
      });
    });

    describe('Dirty flag handling', () => {
      it('should return early when _isDirty is true', () => {
        (component as any)._isDirty = true;
        const initialActiveType = component.activeScheduleType;

        (component as any)._handleModelChange('0 12 * * ? *');

        expect(component.activeScheduleType).toBe(initialActiveType);
        expect((component as any)._isDirty).toBe(false);
      });

      it('should process when _isDirty is false', () => {
        (component as any)._isDirty = false;

        (component as any)._handleModelChange('0/5 * 1/1 * ? *');

        expect(component.activeScheduleType).toBe('Minutes');
      });
    });

    describe('Minutes pattern parsing', () => {
      it('should parse minutes cron expression with 1/1 pattern', () => {
        (component as any)._handleModelChange('0/5 * 1/1 * ? *');

        expect(component.activeScheduleType).toBe('Minutes');
        expect(component.state.minutes.minutes).toBe(5);
      });

      it('should parse single digit minutes', () => {
        (component as any)._handleModelChange('0/1 * 1/1 * ? *');

        expect(component.activeScheduleType).toBe('Minutes');
        expect(component.state.minutes.minutes).toBe(1);
      });

      it('should parse double digit minutes', () => {
        (component as any)._handleModelChange('0/15 * 1/1 * ? *');

        expect(component.activeScheduleType).toBe('Minutes');
        expect(component.state.minutes.minutes).toBe(15);
      });
    });

    describe('Hourly pattern parsing', () => {
      it('should parse hourly cron expression with 1/1 pattern', () => {
        (component as any)._handleModelChange('30 0/2 1/1 * ? *');

        expect(component.activeScheduleType).toBe('Hourly');
        expect(component.state.hourly.hours).toBe(2);
        expect(component.state.hourly.minutes).toBe(30);
      });

      it('should parse hourly with single digit hours', () => {
        (component as any)._handleModelChange('15 0/1 1/1 * ? *');

        expect(component.activeScheduleType).toBe('Hourly');
        expect(component.state.hourly.hours).toBe(1);
        expect(component.state.hourly.minutes).toBe(15);
      });
    });

    describe('Daily pattern parsing', () => {
      it('should parse every N days pattern', () => {
        (component as any)._handleModelChange('15 9 1/3 * ? *');

        expect(component.activeScheduleType).toBe('Daily');
        expect(component.state.daily.subTab).toBe('everyDays');
        expect(component.state.daily.everyDays.days).toBe(3);
        expect(component.state.daily.everyDays.hours).toBe(9);
        expect(component.state.daily.everyDays.minutes).toBe(15);
      });

      it('should parse every single day pattern', () => {
        (component as any)._handleModelChange('0 8 1/1 * ? *');

        expect(component.activeScheduleType).toBe('Daily');
        expect(component.state.daily.subTab).toBe('everyDays');
        expect(component.state.daily.everyDays.days).toBe(1);
        expect(component.state.daily.everyDays.hours).toBe(8);
        expect(component.state.daily.everyDays.minutes).toBe(0);
      });

      it('should parse weekday pattern', () => {
        (component as any)._handleModelChange('0 8 ? * MON-FRI *');

        expect(component.activeScheduleType).toBe('Daily');
        expect(component.state.daily.subTab).toBe('everyWeekDay');
        expect(component.state.daily.everyWeekDay.hours).toBe(8);
        expect(component.state.daily.everyWeekDay.minutes).toBe(0);
      });

      it('should handle 12-hour time format for daily pattern', () => {
        component.use24HourTime = false;
        (component as any)._handleModelChange('0 14 1/1 * ? *');

        expect(component.activeScheduleType).toBe('Daily');
        expect(component.state.daily.everyDays.hours).toBe(2);
        expect(component.state.daily.everyDays.hourType).toBe('PM');
      });
    });

    describe('Weekly pattern parsing', () => {
      it('should parse single day weekly pattern', () => {
        (component as any)._handleModelChange('0 10 ? * MON *');

        expect(component.activeScheduleType).toBe('Weekly');
        expect(component.state.weekly.MON).toBe(true);
        expect(component.state.weekly.TUE).toBe(false);
        expect(component.state.weekly.hours).toBe(10);
        expect(component.state.weekly.minutes).toBe(0);
      });

      it('should parse multiple days weekly pattern', () => {
        (component as any)._handleModelChange('30 14 ? * MON,WED,FRI *');

        expect(component.activeScheduleType).toBe('Weekly');
        expect(component.state.weekly.MON).toBe(true);
        expect(component.state.weekly.TUE).toBe(false);
        expect(component.state.weekly.WED).toBe(true);
        expect(component.state.weekly.THU).toBe(false);
        expect(component.state.weekly.FRI).toBe(true);
        expect(component.state.weekly.SAT).toBe(false);
        expect(component.state.weekly.SUN).toBe(false);
      });

      it('should reset all days before setting new ones', () => {
        // First set some days manually
        component.state.weekly = {
          MON: false,
          TUE: true,
          WED: false,
          THU: true,
          FRI: false,
          SAT: true,
          SUN: false,
          hours: 12,
          minutes: 0,
          hourType: undefined
        };

        (component as any)._handleModelChange('0 12 ? * MON,FRI *');

        expect(component.state.weekly.MON).toBe(true);
        expect(component.state.weekly.TUE).toBe(false);
        expect(component.state.weekly.WED).toBe(false);
        expect(component.state.weekly.THU).toBe(false);
        expect(component.state.weekly.FRI).toBe(true);
        expect(component.state.weekly.SAT).toBe(false);
        expect(component.state.weekly.SUN).toBe(false);
      });
    });

    describe('Monthly pattern parsing', () => {
      it('should parse specific day monthly pattern', () => {
        (component as any)._handleModelChange('0 12 15 1/2 ? *');

        expect(component.activeScheduleType).toBe('Monthly');
        expect(component.state.monthly.subTab).toBe('specificDay');
        expect(component.state.monthly.specificDay.day).toBe('15');
        expect(component.state.monthly.specificDay.months).toBe(2);
        expect(component.state.monthly.runOnWeekday).toBe(false);
      });

      it('should parse weekday monthly pattern', () => {
        (component as any)._handleModelChange('0 12 1W 1/1 ? *');

        expect(component.activeScheduleType).toBe('Monthly');
        expect(component.state.monthly.specificDay.day).toBe('1');
        expect(component.state.monthly.runOnWeekday).toBe(true);
      });

      it('should parse specific week day monthly pattern', () => {
        (component as any)._handleModelChange('0 10 ? 2/3 MON#2 *');

        expect(component.activeScheduleType).toBe('Monthly');
        expect(component.state.monthly.subTab).toBe('specificWeekDay');
        expect(component.state.monthly.specificWeekDay.day).toBe('MON');
        expect(component.state.monthly.specificWeekDay.monthWeek).toBe('#2');
        expect(component.state.monthly.specificWeekDay.startMonth).toBe(2);
        expect(component.state.monthly.specificWeekDay.months).toBe(3);
      });

      it('should parse last occurrence monthly pattern', () => {
        (component as any)._handleModelChange('0 15 ? 1/1 FRIL *');

        expect(component.activeScheduleType).toBe('Monthly');
        expect(component.state.monthly.subTab).toBe('specificWeekDay');
        expect(component.state.monthly.specificWeekDay.day).toBe('FRI');
        expect(component.state.monthly.specificWeekDay.monthWeek).toBe('L');
      });

      it('should handle last day of month pattern', () => {
        (component as any)._handleModelChange('0 12 L 1/1 ? *');

        expect(component.activeScheduleType).toBe('Monthly');
        expect(component.state.monthly.specificDay.day).toBe('L');
      });
    });

    describe('Yearly pattern parsing', () => {
      it('should parse specific month day yearly pattern', () => {
        (component as any)._handleModelChange('0 9 25 12 ? *');

        expect(component.activeScheduleType).toBe('Yearly');
        expect(component.state.yearly.subTab).toBe('specificMonthDay');
        expect(component.state.yearly.specificMonthDay.day).toBe('25');
        expect(component.state.yearly.specificMonthDay.month).toBe(12);
        expect(component.state.yearly.runOnWeekday).toBe(false);
      });

      it('should parse weekday yearly pattern', () => {
        (component as any)._handleModelChange('0 9 1W 6 ? *');

        expect(component.activeScheduleType).toBe('Yearly');
        expect(component.state.yearly.specificMonthDay.day).toBe('1');
        expect(component.state.yearly.runOnWeekday).toBe(true);
      });

      it('should parse specific month week yearly pattern', () => {
        (component as any)._handleModelChange('0 10 ? 11 THU#4 *');

        expect(component.activeScheduleType).toBe('Yearly');
        expect(component.state.yearly.subTab).toBe('specificMonthWeek');
        expect(component.state.yearly.specificMonthWeek.day).toBe('THU');
        expect(component.state.yearly.specificMonthWeek.monthWeek).toBe('#4');
        expect(component.state.yearly.specificMonthWeek.month).toBe(11);
      });
    });

    describe('Advanced pattern parsing', () => {
      it('should set advanced mode for truly unrecognized patterns', () => {
        // Use a pattern that doesn't match any of the existing regex patterns
        const customCron = '5 10 15 * * ?';
        (component as any)._handleModelChange(customCron);

        expect(component.activeScheduleType).toBe('Advanced');
        expect(component.form.controls.advanced.value).toBe(customCron);
      });

      it('should handle complex custom expressions with wildcards', () => {
        // Pattern that uses wildcards in a way that doesn't match standard patterns
        const complexCron = '*/15 10-12 * * 1-5 *';
        (component as any)._handleModelChange(complexCron);

        expect(component.activeScheduleType).toBe('Advanced');
        expect(component.form.controls.advanced.value).toBe(complexCron);
      });

      it('should handle invalid but 6-part expressions', () => {
        const invalidCron = '99 99 99 99 99 99';
        (component as any)._handleModelChange(invalidCron);

        expect(component.activeScheduleType).toBe('Advanced');
        expect(component.form.controls.advanced.value).toBe(invalidCron);
      });

      it('should handle cron with ranges that do not match standard patterns', () => {
        const rangeCron = '0 8-17 * * 1,3,5 *';
        (component as any)._handleModelChange(rangeCron);

        expect(component.activeScheduleType).toBe('Advanced');
        expect(component.form.controls.advanced.value).toBe(rangeCron);
      });

      it('should handle cron with step values in non-standard positions', () => {
        const stepCron = '0 */3 */2 * * ?';
        (component as any)._handleModelChange(stepCron);

        expect(component.activeScheduleType).toBe('Advanced');
        expect(component.form.controls.advanced.value).toBe(stepCron);
      });

      it('should handle cron with specific numeric values that do not match patterns', () => {
        const numericCron = '45 22 5,15,25 * * *';
        (component as any)._handleModelChange(numericCron);

        expect(component.activeScheduleType).toBe('Advanced');
        expect(component.form.controls.advanced.value).toBe(numericCron);
      });

      it('should handle cron expressions with question marks in different positions', () => {
        const questionCron = '0 12 ? 6 * 2024';
        (component as any)._handleModelChange(questionCron);

        expect(component.activeScheduleType).toBe('Advanced');
        expect(component.form.controls.advanced.value).toBe(questionCron);
      });

      it('should handle expressions with mixed separators', () => {
        const mixedCron = '0 9 1-15 JAN-DEC ? *';
        (component as any)._handleModelChange(mixedCron);

        expect(component.activeScheduleType).toBe('Advanced');
        expect(component.form.controls.advanced.value).toBe(mixedCron);
      });
    });

    describe('Time format handling', () => {
      it('should handle 24-hour format correctly', () => {
        component.use24HourTime = true;
        (component as any)._handleModelChange('0 23 ? * MON *');

        expect(component.activeScheduleType).toBe('Weekly');
        expect(component.state.weekly.hours).toBe(23);
        expect(component.state.weekly.hourType).toBeUndefined();
      });

      it('should convert to 12-hour format when use24HourTime is false', () => {
        component.use24HourTime = false;
        (component as any)._handleModelChange('0 15 ? * MON *');

        expect(component.activeScheduleType).toBe('Weekly');
        expect(component.state.weekly.hours).toBe(3);
        expect(component.state.weekly.hourType).toBe('PM');
      });

      it('should handle midnight in 12-hour format', () => {
        component.use24HourTime = false;
        (component as any)._handleModelChange('0 0 ? * MON *');

        expect(component.activeScheduleType).toBe('Weekly');
        expect(component.state.weekly.hours).toBe(12);
        expect(component.state.weekly.hourType).toBe('AM');
      });

      it('should handle noon in 12-hour format', () => {
        component.use24HourTime = false;
        (component as any)._handleModelChange('0 12 ? * MON *');

        expect(component.activeScheduleType).toBe('Weekly');
        expect(component.state.weekly.hours).toBe(12);
        expect(component.state.weekly.hourType).toBe('PM');
      });
    });

    describe('Edge cases and regex matching', () => {
      it('should handle minutes pattern with different formats', () => {
        (component as any)._handleModelChange('0/30 * 1/1 * ? *');
        expect(component.activeScheduleType).toBe('Minutes');
        expect(component.state.minutes.minutes).toBe(30);
      });

      it('should handle hourly pattern with different minute values', () => {
        (component as any)._handleModelChange('45 0/3 1/1 * ? *');
        expect(component.activeScheduleType).toBe('Hourly');
        expect(component.state.hourly.hours).toBe(3);
        expect(component.state.hourly.minutes).toBe(45);
      });

      it('should handle daily pattern with large day intervals', () => {
        (component as any)._handleModelChange('30 15 1/7 * ? *');
        expect(component.activeScheduleType).toBe('Daily');
        expect(component.state.daily.everyDays.days).toBe(7);
      });

      it('should handle all weekdays in weekly pattern', () => {
        (component as any)._handleModelChange(
          '0 9 ? * MON,TUE,WED,THU,FRI,SAT,SUN *'
        );
        expect(component.activeScheduleType).toBe('Weekly');
        expect(component.state.weekly.MON).toBe(true);
        expect(component.state.weekly.TUE).toBe(true);
        expect(component.state.weekly.WED).toBe(true);
        expect(component.state.weekly.THU).toBe(true);
        expect(component.state.weekly.FRI).toBe(true);
        expect(component.state.weekly.SAT).toBe(true);
        expect(component.state.weekly.SUN).toBe(true);
      });
    });
  });

  describe('Form validation', () => {
    it('should validate advanced cron expressions', () => {
      const advancedControl = component.form.controls.advanced;

      // Valid cron
      advancedControl.setValue('0 12 1 1 ? *');
      expect(advancedControl.errors).toBeNull();

      // Invalid cron
      advancedControl.setValue('invalid cron');
      expect(advancedControl.errors).toEqual({
        invalidExpression: 'Invalid cron expression format'
      });

      // Empty value should be valid
      advancedControl.setValue('');
      expect(advancedControl.errors).toBeNull();
    });

    it('should validate cron with wrong number of parts', () => {
      const advancedControl = component.form.controls.advanced;

      advancedControl.setValue('0 12 1');
      expect(advancedControl.errors).toEqual({
        invalidExpression: 'Invalid cron expression format'
      });
    });

    it('should require advanced field when Advanced tab is selected', () => {
      component.setActiveScheduleType('Advanced');
      const advancedControl = component.form.controls.advanced;

      advancedControl.setValue('');
      expect(advancedControl.hasError('required')).toBe(true);

      advancedControl.setValue('0 12 1 1 ? *');
      expect(advancedControl.hasError('required')).toBe(false);
    });

    it('should remove required validator when not in Advanced mode', () => {
      // First set to Advanced to add required validator
      component.setActiveScheduleType('Advanced');
      let advancedControl = component.form.controls.advanced;
      expect(advancedControl.hasError('required')).toBe(true);

      // Then switch to another tab
      component.setActiveScheduleType('Daily');
      advancedControl = component.form.controls.advanced;
      expect(advancedControl.errors).toBeNull();
    });
  });

  describe('Event emission', () => {
    it('should emit cronChange when cron value changes', () => {
      jest.spyOn(component.cronChange, 'emit');

      component.setActiveScheduleType('Minutes');
      component.state.minutes.minutes = 10;
      component.regenerateCron();

      expect(component.cronChange.emit).toHaveBeenCalledWith(
        '0/10 * 1/1 * ? *'
      );
    });

    it('should emit timeZoneChange when timezone changes', () => {
      jest.spyOn(component.timeZoneChange, 'emit');
      component.showTimeZone = true;

      component.onTimeZoneChanged('America/New_York');

      expect(component.timeZoneChange.emit).toHaveBeenCalledWith(
        'America/New_York'
      );
    });

    it('should not emit timeZoneChange when showTimeZone is false', () => {
      jest.spyOn(component.timeZoneChange, 'emit');
      component.showTimeZone = false;

      component.onTimeZoneChanged('America/New_York');

      expect(component.timeZoneChange.emit).not.toHaveBeenCalled();
    });

    it('should not emit cronChange when value is same', () => {
      jest.spyOn(component.cronChange, 'emit');
      component.cron = '0/5 * 1/1 * ? *';

      (component as any)._updateCron('0/5 * 1/1 * ? *');

      expect(component.cronChange.emit).not.toHaveBeenCalled();
    });
  });

  describe('Helper methods', () => {
    it('should format time values correctly', () => {
      const timeValue = { hours: 9, minutes: 5 };
      const formatted = component.formatTimeValue(timeValue);

      expect(formatted).toEqual({ hours: '09', minutes: '05' });
    });

    it('should format time values with double digits', () => {
      const timeValue = { hours: 23, minutes: 45 };
      const formatted = component.formatTimeValue(timeValue);

      expect(formatted).toEqual({ hours: '23', minutes: '45' });
    });

    it('should handle time changes', () => {
      const timeValue = { hours: '14', minutes: '30' };
      const target = { hours: 0, minutes: 0 };

      jest.spyOn(component, 'regenerateCron');

      component.onTimeChanged(timeValue, target);

      expect(target.hours).toBe(14);
      expect(target.minutes).toBe(30);
      expect(component.regenerateCron).toHaveBeenCalled();
    });

    it('should handle invalid time strings', () => {
      const timeValue = { hours: 'invalid', minutes: 'invalid' };
      const target = { hours: 5, minutes: 10 };

      component.onTimeChanged(timeValue, target);

      expect(target.hours).toBe(0);
      expect(target.minutes).toBe(0);
    });

    it('should convert hour to cron format in 24-hour mode', () => {
      component.use24HourTime = true;
      const result = (component as any)._hourToCron(15, 'PM');
      expect(result).toBe(15);
    });

    it('should convert hour to cron format in 12-hour mode', () => {
      component.use24HourTime = false;
      expect((component as any)._hourToCron(2, 'PM')).toBe(14);
      expect((component as any)._hourToCron(12, 'PM')).toBe(12);
      expect((component as any)._hourToCron(12, 'AM')).toBe(0);
      expect((component as any)._hourToCron(1, 'AM')).toBe(1);
    });

    it('should get AM/PM hour correctly', () => {
      component.use24HourTime = false;
      expect((component as any)._getAmPmHour(0)).toBe(12);
      expect((component as any)._getAmPmHour(12)).toBe(12);
      expect((component as any)._getAmPmHour(15)).toBe(3);
      expect((component as any)._getAmPmHour(23)).toBe(11);
    });

    it('should get hour type correctly', () => {
      component.use24HourTime = false;
      expect((component as any)._getHourType(0)).toBe('AM');
      expect((component as any)._getHourType(11)).toBe('AM');
      expect((component as any)._getHourType(12)).toBe('PM');
      expect((component as any)._getHourType(23)).toBe('PM');
    });

    it('should return undefined hour type in 24-hour mode', () => {
      component.use24HourTime = true;
      expect((component as any)._getHourType(15)).toBeUndefined();
    });
  });

  describe('Component properties', () => {
    it('should have correct default values', () => {
      expect(component.label).toBe('');
      expect(component.timeZone).toBe(
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      );
      expect(component.showNotSet).toBe(true);
      expect(component.showAdvanced).toBe(true);
      expect(component.showMinutes).toBe(true);
      expect(component.showTimeZone).toBe(false);
      expect(component.defaultTime).toBe('00:00');
      expect(component.use24HourTime).toBe(true);
      expect(component.disabled).toBe(false);
    });

    it('should have correct select options structure', () => {
      expect(component.selectOptions).toBeDefined();
      expect(component.selectOptions.months).toBeDefined();
      expect(component.selectOptions.days).toBeDefined();
      expect(component.selectOptions.hours).toBeDefined();
      expect(component.selectOptions.minutes).toBeDefined();
      expect(component.selectOptions.monthDays).toBeDefined();
      expect(component.selectOptions.monthWeeks).toBeDefined();
    });

    it('should have correct timezone options', () => {
      expect(component.timeZoneOptions).toEqual([
        { label: 'UTC', value: 'UTC' },
        { label: 'America/New_York', value: 'America/New_York' },
        { label: 'Europe/London', value: 'Europe/London' }
      ]);
    });

    it('should have correct month day labels', () => {
      expect((component as any)._getMonthDayLabel('1')).toBe('1st day');
      expect((component as any)._getMonthDayLabel('2')).toBe('2nd day');
      expect((component as any)._getMonthDayLabel('3')).toBe('3rd day');
      expect((component as any)._getMonthDayLabel('4')).toBe('4th day');
      expect((component as any)._getMonthDayLabel('11')).toBe('11th day');
      expect((component as any)._getMonthDayLabel('21')).toBe('21st day');
      expect((component as any)._getMonthDayLabel('L')).toBe('Last Day');
    });
  });

  describe('Cron regeneration', () => {
    it('should not change cron when disabled', () => {
      component.disabled = true;
      const initialCron = component.cron;

      component.setActiveScheduleType('Minutes');

      expect(component.cron).toBe(initialCron);
    });

    it('should handle tab change parameter', () => {
      component.setActiveScheduleType('Advanced');
      component.form.controls.advanced.setValue('0 12 * * ? *');

      component.regenerateCron(true);

      expect(component.form.controls.advanced.value).toBe(component.cron);
    });

    it('should throw error for invalid daily subtab', () => {
      component.setActiveScheduleType('Daily');
      component.state.daily.subTab = 'invalid';

      expect(() => component.regenerateCron()).toThrow(
        'Invalid cron daily subtab selection'
      );
    });

    it('should throw error for invalid monthly subtab', () => {
      component.setActiveScheduleType('Monthly');
      component.state.monthly.subTab = 'invalid';

      expect(() => component.regenerateCron()).toThrow(
        'Invalid cron monthly subtab selection'
      );
    });

    it('should throw error for invalid yearly subtab', () => {
      component.setActiveScheduleType('Yearly');
      component.state.yearly.subTab = 'invalid';

      expect(() => component.regenerateCron()).toThrow(
        'Invalid cron yearly subtab selection'
      );
    });

    it('should throw error for invalid cron type when showNotSet is false', () => {
      component.showNotSet = false;
      component.activeScheduleType = 'Invalid';

      expect(() => component.regenerateCron()).toThrow('Invalid cron type');
    });
  });

  describe('ngOnChanges', () => {
    it('should handle cron changes after first change', () => {
      jest.spyOn(component as any, '_handleModelChange');

      const changes = {
        value: {
          currentValue: '0/5 * 1/1 * ? *',
          previousValue: '',
          firstChange: false,
          isFirstChange: () => false
        }
      };

      component.ngOnChanges(changes);

      expect((component as any)._handleModelChange).toHaveBeenCalledWith(
        component.cron
      );
    });

    it('should not handle first change', () => {
      jest.spyOn(component as any, '_handleModelChange');

      const changes = {
        value: {
          currentValue: '0/5 * 1/1 * ? *',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      };

      component.ngOnChanges(changes);

      expect((component as any)._handleModelChange).not.toHaveBeenCalled();
    });
  });
});
