import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';

import { CpsTimepickerComponent, CpsTime } from './cps-timepicker.component';

describe('CpsTimepickerComponent', () => {
  let component: CpsTimepickerComponent;
  let fixture: ComponentFixture<CpsTimepickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsTimepickerComponent, NoopAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CpsTimepickerComponent);
    component = fixture.componentInstance;
    component.label = 'Test';
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('label', () => {
    it('should display the label when provided', () => {
      const labelEl = fixture.debugElement.query(
        By.css('.cps-timepicker-label label')
      );
      expect(labelEl.nativeElement.textContent.trim()).toBe('Test');
    });

    it('should not render the label element when label is empty', () => {
      component.label = '';
      component.ariaLabel = 'Test timepicker';
      fixture.detectChanges();
      const labelEl = fixture.debugElement.query(
        By.css('.cps-timepicker-label')
      );
      expect(labelEl).toBeNull();
    });

    it('should apply disabled class to label when disabled is true', () => {
      component.disabled = true;
      fixture.detectChanges();
      const disabledLabel = fixture.debugElement.query(
        By.css('.cps-timepicker-label-disabled')
      );
      expect(disabledLabel).toBeTruthy();
    });

    it('should not apply disabled class to label when disabled is false', () => {
      const disabledLabel = fixture.debugElement.query(
        By.css('.cps-timepicker-label-disabled')
      );
      expect(disabledLabel).toBeNull();
    });
  });

  describe('ngOnChanges', () => {
    it('should log an error when both label and ariaLabel are empty', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      component.label = '';
      component.ariaLabel = '';
      component.ngOnChanges();
      expect(consoleSpy).toHaveBeenCalledWith(
        'CpsTimepickerComponent: unlabeled timepicker component must have an ariaLabel for accessibility.'
      );
    });

    it('should not log an error when label is provided', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      component.label = 'Time';
      component.ariaLabel = '';
      component.ngOnChanges();
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should not log an error when ariaLabel is provided', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      component.label = '';
      component.ariaLabel = 'Select time';
      component.ngOnChanges();
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should treat whitespace-only label as empty', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      component.label = '   ';
      component.ariaLabel = '';
      component.ngOnChanges();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnInit — hours options', () => {
    type HourOption = { label: string; value: string; alias?: string };

    it('should initialize 12-hour options (01–12) by default', () => {
      expect(component.hoursOptions.length).toBe(12);
      expect(component.hoursOptions[0].value).toBe('01');
      expect(component.hoursOptions[11].value).toBe('12');
    });

    it('should include an alias for each 12-hour option', () => {
      const hour12 = component.hoursOptions.find(
        (h) => h.value === '12'
      ) as HourOption;
      expect(hour12?.alias).toBe('00');

      const hour1 = component.hoursOptions.find(
        (h) => h.value === '01'
      ) as HourOption;
      expect(hour1?.alias).toBe('13');
    });

    it('should initialize 24-hour options (00–23) when use24HourTime is true', () => {
      component.use24HourTime = true;
      component.ngOnInit();
      expect(component.hoursOptions.length).toBe(24);
      expect(component.hoursOptions[0].value).toBe('00');
      expect(component.hoursOptions[23].value).toBe('23');
    });

    it('should not include an alias for 24-hour options', () => {
      component.use24HourTime = true;
      component.ngOnInit();
      (component.hoursOptions as HourOption[]).forEach((h) =>
        expect(h.alias).toBeUndefined()
      );
    });
  });

  describe('ngOnInit — minutes options', () => {
    it('should have 60 minutes options (00–59)', () => {
      expect(component.minutesOptions.length).toBe(60);
      expect(component.minutesOptions[0].value).toBe('00');
      expect(component.minutesOptions[59].value).toBe('59');
    });
  });

  describe('ngOnInit — seconds options', () => {
    it('should have empty secondsOptions by default', () => {
      expect(component.secondsOptions.length).toBe(0);
    });

    it('should populate secondsOptions (00–59) when withSeconds is true', () => {
      component.withSeconds = true;
      component.ngOnInit();
      expect(component.secondsOptions.length).toBe(60);
      expect(component.secondsOptions[0].value).toBe('00');
      expect(component.secondsOptions[59].value).toBe('59');
    });
  });

  describe('ngAfterViewInit', () => {
    it('should set isTimePickerField on hoursField and minutesField', () => {
      const mockField = { isTimePickerField: false };
      (component as any).hoursField = mockField;
      (component as any).minutesField = { ...mockField };
      component.ngAfterViewInit();
      expect((component as any).hoursField.isTimePickerField).toBe(true);
      expect((component as any).minutesField.isTimePickerField).toBe(true);
    });

    it('should set isTimePickerField on secondsField when present', () => {
      const mockSecondsField = { isTimePickerField: false };
      (component as any).secondsField = mockSecondsField;
      component.ngAfterViewInit();
      expect((component as any).secondsField.isTimePickerField).toBe(true);
    });

    it('should not throw when child fields are not present', () => {
      (component as any).hoursField = undefined;
      (component as any).minutesField = undefined;
      (component as any).secondsField = undefined;
      expect(() => component.ngAfterViewInit()).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from statusChanges on destroy', () => {
      const unsubscribeSpy = jest.fn();
      (component as any)._statusChangesSubscription = {
        unsubscribe: unsubscribeSpy
      };
      component.ngOnDestroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should not throw when there is no subscription', () => {
      (component as any)._statusChangesSubscription = undefined;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('value setter / getter', () => {
    it('should set and retrieve the value', () => {
      const time: CpsTime = { hours: '10', minutes: '30' };
      component.value = time;
      expect(component.value).toEqual(time);
    });

    it('should accept undefined and store undefined', () => {
      component.value = { hours: '10', minutes: '30' };
      component.value = undefined;
      expect(component.value).toBeUndefined();
    });

    it('should call onChange when value is set', () => {
      const onChangeSpy = jest.fn();
      component.registerOnChange(onChangeSpy);
      const time: CpsTime = { hours: '08', minutes: '45' };
      component.value = time;
      expect(onChangeSpy).toHaveBeenCalledWith(time);
    });
  });

  describe('registerOnChange', () => {
    it('should register a callback that is called on value change', () => {
      const cb = jest.fn();
      component.registerOnChange(cb);
      component.value = { hours: '01', minutes: '00' };
      expect(cb).toHaveBeenCalledWith({ hours: '01', minutes: '00' });
    });
  });

  describe('registerOnTouched', () => {
    it('should register a touched callback', () => {
      const cb = jest.fn();
      component.registerOnTouched(cb);
      expect((component as any).onTouched).toBe(cb);
    });
  });

  describe('updateHours', () => {
    it('should update value.hours', () => {
      component.value = { hours: '10', minutes: '30' };
      component.updateHours('11');
      expect(component.value?.hours).toBe('11');
    });

    it('should emit valueChanged with the updated value', () => {
      const spy = jest.spyOn(component.valueChanged, 'emit');
      component.value = { hours: '10', minutes: '30' };
      component.updateHours('11');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ hours: '11' })
      );
    });

    it('should auto-set dayPeriod to PM when hour is 13–23 in 12-hour mode', () => {
      component.value = { hours: '01', minutes: '00', dayPeriod: 'AM' };
      component.updateHours('15');
      expect(component.value?.dayPeriod).toBe('PM');
    });

    it('should not auto-set dayPeriod to PM in 24-hour mode', () => {
      component.use24HourTime = true;
      component.ngOnInit();
      component.value = { hours: '10', minutes: '00' };
      component.updateHours('15');
      expect(component.value?.dayPeriod).toBeUndefined();
    });

    it('should initialize value when it is undefined and a non-empty hour is given', () => {
      expect(component.value).toBeUndefined();
      component.updateHours('10');
      expect(component.value).toBeDefined();
      expect(component.value?.hours).toBe('10');
    });

    it('should set hours to empty string when empty string is passed', () => {
      component.value = { hours: '10', minutes: '30' };
      component.updateHours('');
      expect(component.value?.hours).toBe('');
    });
  });

  describe('updateMinutes', () => {
    it('should update value.minutes', () => {
      component.value = { hours: '10', minutes: '30' };
      component.updateMinutes('45');
      expect(component.value?.minutes).toBe('45');
    });

    it('should emit valueChanged with the updated value', () => {
      const spy = jest.spyOn(component.valueChanged, 'emit');
      component.value = { hours: '10', minutes: '30' };
      component.updateMinutes('45');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ minutes: '45' })
      );
    });

    it('should initialize value when it is undefined and non-empty minutes are given', () => {
      expect(component.value).toBeUndefined();
      component.updateMinutes('30');
      expect(component.value).toBeDefined();
      expect(component.value?.minutes).toBe('30');
    });

    it('should not initialize value when empty string is passed', () => {
      expect(component.value).toBeUndefined();
      component.updateMinutes('');
      expect(component.value).toBeUndefined();
    });
  });

  describe('updateSeconds', () => {
    it('should update value.seconds', () => {
      component.withSeconds = true;
      component.value = { hours: '10', minutes: '30', seconds: '00' };
      component.updateSeconds('45');
      expect(component.value?.seconds).toBe('45');
    });

    it('should emit valueChanged with the updated value', () => {
      const spy = jest.spyOn(component.valueChanged, 'emit');
      component.value = { hours: '10', minutes: '30', seconds: '00' };
      component.updateSeconds('45');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ seconds: '45' })
      );
    });

    it('should initialize value when it is undefined and non-empty seconds are given', () => {
      expect(component.value).toBeUndefined();
      component.updateSeconds('30');
      expect(component.value).toBeDefined();
    });
  });

  describe('updateDayPeriod', () => {
    it('should update value.dayPeriod', () => {
      component.value = { hours: '10', minutes: '30', dayPeriod: 'AM' };
      component.updateDayPeriod('PM');
      expect(component.value?.dayPeriod).toBe('PM');
    });

    it('should emit valueChanged with the updated value', () => {
      const spy = jest.spyOn(component.valueChanged, 'emit');
      component.value = { hours: '10', minutes: '30', dayPeriod: 'AM' };
      component.updateDayPeriod('PM');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ dayPeriod: 'PM' })
      );
    });

    it('should initialize value when it is undefined and dayPeriod is provided', () => {
      expect(component.value).toBeUndefined();
      component.updateDayPeriod('AM');
      expect(component.value).toBeDefined();
    });
  });

  describe('_initValue (via update methods)', () => {
    it('should add dayPeriod AM when use24HourTime is false and value has no dayPeriod', () => {
      component.use24HourTime = false;
      component.value = { hours: '10', minutes: '' };
      delete component.value.dayPeriod;
      component.updateMinutes('30');
      expect(component.value?.dayPeriod).toBe('AM');
    });

    it('should add seconds empty string when withSeconds is true and value has no seconds', () => {
      component.withSeconds = true;
      component.value = { hours: '10', minutes: '' };
      delete (component.value as any).seconds;
      component.updateMinutes('30');
      expect('seconds' in (component.value as CpsTime)).toBe(true);
      expect(component.value?.seconds).toBe('');
    });

    it('should not overwrite existing dayPeriod when _initValue is called', () => {
      component.use24HourTime = false;
      component.value = { hours: '10', minutes: '00', dayPeriod: 'PM' };
      component.updateMinutes('30');
      expect(component.value?.dayPeriod).toBe('PM');
    });
  });

  describe('numberOnly', () => {
    it('should allow digit characters (0–9, codes 48–57)', () => {
      for (let code = 48; code <= 57; code++) {
        expect(component.numberOnly({ which: code })).toBe(true);
      }
    });

    it('should allow control characters (code <= 31)', () => {
      expect(component.numberOnly({ which: 8 })).toBe(true); // Backspace
      expect(component.numberOnly({ which: 13 })).toBe(true); // Enter
      expect(component.numberOnly({ which: 0 })).toBe(true);
    });

    it('should block non-digit printable characters', () => {
      expect(component.numberOnly({ which: 65 })).toBe(false); // 'A'
      expect(component.numberOnly({ which: 47 })).toBe(false); // '/'
      expect(component.numberOnly({ which: 58 })).toBe(false); // ':'
    });

    it('should fall back to keyCode when which is 0', () => {
      expect(component.numberOnly({ which: 0, keyCode: 50 })).toBe(true); // '2'
      expect(component.numberOnly({ which: 0, keyCode: 65 })).toBe(false); // 'A'
    });
  });

  describe('onFieldBlur', () => {
    it('should emit blurred', () => {
      const spy = jest.spyOn(component.blurred, 'emit');
      component.onFieldBlur();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onFieldFocus', () => {
    it('should emit focused', () => {
      const spy = jest.spyOn(component.focused, 'emit');
      component.onFieldFocus();
      expect(spy).toHaveBeenCalled();
    });

    it('should mark the control as touched when a control is present', () => {
      const markAsTouchedSpy = jest.fn();
      (component as any)._control = {
        control: { markAsTouched: markAsTouchedSpy }
      };
      component.onFieldFocus();
      expect(markAsTouchedSpy).toHaveBeenCalled();
    });
  });

  describe('hint display', () => {
    it('should display the hint when there is no error and hideDetails is false', () => {
      component.hint = 'Select a time';
      component.error = '';
      fixture.detectChanges();
      const hintEl = fixture.debugElement.query(By.css('.cps-timepicker-hint'));
      expect(hintEl).toBeTruthy();
      expect(hintEl.nativeElement.textContent.trim()).toBe('Select a time');
    });

    it('should not display the hint when hideDetails is true', () => {
      component.hint = 'Select a time';
      component.hideDetails = true;
      fixture.detectChanges();
      const hintEl = fixture.debugElement.query(By.css('.cps-timepicker-hint'));
      expect(hintEl).toBeNull();
    });

    it('should not display the hint when an error is present', () => {
      component.hint = 'Select a time';
      component.error = 'Time is invalid';
      fixture.detectChanges();
      const hintEl = fixture.debugElement.query(By.css('.cps-timepicker-hint'));
      expect(hintEl).toBeNull();
    });
  });

  describe('error display', () => {
    it('should display the error when error is set and hideDetails is false', () => {
      component.error = 'Time is invalid';
      fixture.detectChanges();
      const errorEl = fixture.debugElement.query(
        By.css('.cps-timepicker-error')
      );
      expect(errorEl).toBeTruthy();
      expect(errorEl.nativeElement.textContent.trim()).toBe('Time is invalid');
    });

    it('should not display the error when hideDetails is true', () => {
      component.error = 'Time is invalid';
      component.hideDetails = true;
      fixture.detectChanges();
      const errorEl = fixture.debugElement.query(
        By.css('.cps-timepicker-error')
      );
      expect(errorEl).toBeNull();
    });

    it('should not display the error element when error is empty', () => {
      component.error = '';
      fixture.detectChanges();
      const errorEl = fixture.debugElement.query(
        By.css('.cps-timepicker-error')
      );
      expect(errorEl).toBeNull();
    });
  });

  describe('_checkErrors', () => {
    function mockControl(
      options: Partial<{
        touched: boolean;
        errors: Record<string, unknown> | null;
        statusChanges: Subject<string>;
      }>
    ) {
      (component as any)._control = {
        control: {
          touched: options.touched ?? false,
          markAsTouched: jest.fn()
        },
        errors: options.errors ?? null,
        statusChanges: options.statusChanges ?? new Subject()
      };
    }

    it('should show "Field is required" when control has required error and is touched', () => {
      mockControl({ touched: true, errors: { required: true } });
      component.value = undefined;
      component.onFieldBlur();
      expect(component.error).toBe('Field is required');
      expect(component.hoursError).toBe('Field is required');
      expect(component.minutesError).toBe('Field is required');
    });

    it('should show a custom string error message from the errors object', () => {
      mockControl({
        touched: true,
        errors: { custom: 'Invalid time range' }
      });
      component.value = undefined;
      component.onFieldBlur();
      expect(component.error).toBe('Invalid time range');
    });

    it('should show "Unknown error" when error value is not a string', () => {
      mockControl({ touched: true, errors: { custom: true } });
      component.value = undefined;
      component.onFieldBlur();
      expect(component.error).toBe('Unknown error');
    });

    it('should clear errors when control is untouched', () => {
      component.error = 'Field is required';
      mockControl({ touched: false, errors: { required: true } });
      component.onFieldBlur();
      expect(component.error).toBe('');
    });

    it('should clear errors when control has no errors', () => {
      component.error = 'Field is required';
      mockControl({ touched: true, errors: null });
      component.onFieldBlur();
      expect(component.error).toBe('');
    });

    it('should show invalid-value errors when value exists but is incomplete', () => {
      mockControl({ touched: false, errors: null });
      component.value = { hours: '10', minutes: '' };
      component.onFieldBlur();
      expect(component.error).toBe('Time is invalid');
      expect(component.hoursError).toBe('');
      expect(component.minutesError).toBe('Time is invalid');
    });

    it('should show invalid-value error for missing seconds when withSeconds is true', () => {
      mockControl({ touched: false, errors: null });
      component.withSeconds = true;
      component.value = { hours: '10', minutes: '30', seconds: '' };
      component.onFieldBlur();
      expect(component.error).toBe('Time is invalid');
      expect(component.secondsError).toBe('Time is invalid');
    });

    it('should set secondsError to empty string when withSeconds is false and setErrors is called', () => {
      component.withSeconds = false;
      mockControl({ touched: true, errors: { required: true } });
      component.value = undefined;
      component.onFieldBlur();
      expect(component.secondsError).toBe('');
    });

    it('should set secondsError when withSeconds is true and setErrors is called', () => {
      component.withSeconds = true;
      mockControl({ touched: true, errors: { required: true } });
      component.value = undefined;
      component.onFieldBlur();
      expect(component.secondsError).toBe('Field is required');
    });
  });

  describe('statusChanges subscription', () => {
    it('should call _checkErrors when status changes', () => {
      const statusChanges$ = new Subject<string>();
      (component as any)._control = {
        control: { touched: false, markAsTouched: jest.fn() },
        errors: null,
        statusChanges: statusChanges$
      };
      component.ngOnInit();
      const checkErrorsSpy = jest.spyOn(component as any, '_checkErrors');
      statusChanges$.next('INVALID');
      expect(checkErrorsSpy).toHaveBeenCalled();
    });
  });
});
