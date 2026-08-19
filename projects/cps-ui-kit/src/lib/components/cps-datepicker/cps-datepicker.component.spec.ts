import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CpsDatepickerComponent } from './cps-datepicker.component';
import { CpsMenuHideReason } from '../cps-menu/cps-menu.component';

function keyEvent(key: string, target: HTMLElement): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true
  });
  Object.defineProperty(event, 'target', { value: target, configurable: true });
  return event;
}

function makeDp(
  overrides: Partial<{
    currentView: string;
    currentYear: number;
    currentMonth: number;
    isYearDisabled: (y: number) => boolean;
    isMonthDisabled: (m: number, y: number) => boolean;
    navigationState: unknown;
    _focusKey: string | null;
  }> = {}
) {
  return {
    currentView: 'date',
    currentYear: 2026,
    currentMonth: 5,
    isYearDisabled: jest.fn().mockReturnValue(false),
    isMonthDisabled: jest.fn().mockReturnValue(false),
    navigationState: null,
    _focusKey: null,
    ...overrides
  };
}

function makeDateGrid(
  rows: number,
  cols: number,
  disabledPositions: { row: number; col: number }[] = []
): { tbody: HTMLTableSectionElement; rowEls: HTMLTableRowElement[] } {
  const tbody = document.createElement('tbody');
  const rowEls: HTMLTableRowElement[] = [];
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < cols; c++) {
      const td = document.createElement('td');
      const span = document.createElement('span');
      span.setAttribute('data-date', `2026-${r}-${c}`);
      if (disabledPositions.some((p) => p.row === r && p.col === c)) {
        span.classList.add('p-disabled');
      }
      td.appendChild(span);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
    rowEls.push(tr);
  }
  return { tbody, rowEls };
}

describe('CpsDatepickerComponent', () => {
  let component: CpsDatepickerComponent;
  let fixture: ComponentFixture<CpsDatepickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpsDatepickerComponent, FormsModule, NoopAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CpsDatepickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ariaLabel', 'Test datepicker');
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Inputs', () => {
    it('should default disabled to false', () => {
      expect(component.disabled).toBe(false);
    });

    it('should apply disabled input', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(component.disabled).toBe(true);
    });

    it('should default hideDetails to false', () => {
      expect(component.hideDetails).toBe(false);
    });

    it('should apply hideDetails input by hiding the real hint element', () => {
      fixture.componentRef.setInput('hint', 'Some hint');
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.cps-input-hint')
      ).not.toBeNull();

      fixture.componentRef.setInput('hideDetails', true);
      fixture.detectChanges();
      expect(component.hideDetails).toBe(true);
      expect(fixture.nativeElement.querySelector('.cps-input-hint')).toBeNull();
    });

    it('should default persistentClear to false', () => {
      expect(component.persistentClear).toBe(false);
    });

    it('should apply persistentClear input by keeping the real clear button visible without a value', () => {
      fixture.componentRef.setInput('clearable', true);
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.clear-btn').style.visibility
      ).toBe('hidden');

      fixture.componentRef.setInput('persistentClear', true);
      fixture.detectChanges();
      expect(component.persistentClear).toBe(true);
      expect(
        fixture.nativeElement.querySelector('.clear-btn').style.visibility
      ).toBe('visible');
    });

    it('should convert width on init', () => {
      expect(component.cvtWidth).toBe('100%');
    });

    it('should update cvtWidth when width changes', () => {
      fixture.componentRef.setInput('width', 300);
      component.ngOnChanges({
        width: {
          currentValue: 300,
          previousValue: '100%',
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component.cvtWidth).toBe('300px');
    });

    it('should update stringDate when dateFormat changes (not first change)', () => {
      component.writeValue(new Date(2026, 5, 15));
      fixture.componentRef.setInput('dateFormat', 'MM/DD/YYYY');
      component.ngOnChanges({
        dateFormat: {
          currentValue: 'MM/DD/YYYY',
          previousValue: 'DD/MM/YYYY',
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component.stringDate).toBe('06/15/2026');
    });

    it('should not update stringDate on first change of dateFormat', () => {
      fixture.componentRef.setInput('dateFormat', 'DD/MM/YYYY');
      component.writeValue(new Date(2026, 5, 15));
      component.ngOnChanges({
        dateFormat: {
          currentValue: 'DD/MM/YYYY',
          previousValue: 'DD/MM/YYYY',
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(component.stringDate).toBe('15/06/2026');
    });
  });

  describe('ControlValueAccessor', () => {
    it('should set value via writeValue', () => {
      const date = new Date(2026, 5, 15);
      component.writeValue(date);
      expect(component.value).toBe(date);
    });

    it('should clear value via writeValue(null)', () => {
      component.writeValue(new Date(2026, 5, 15));
      component.writeValue(null);
      expect(component.value).toBeNull();
    });

    it('should call registered onChange when a new value is written', () => {
      const fn = jest.fn();
      component.registerOnChange(fn);
      const date = new Date(2026, 5, 15);
      component.writeValue(date);
      expect(fn).toHaveBeenCalledWith(date);
    });

    it('should call registered onTouched', () => {
      const fn = jest.fn();
      component.registerOnTouched(fn);
      component.onTouched();
      expect(fn).toHaveBeenCalled();
    });
  });

  describe('Date string formatting', () => {
    it('should format as DD/MM/YYYY', () => {
      fixture.componentRef.setInput('dateFormat', 'DD/MM/YYYY');
      component.writeValue(new Date(2026, 0, 5));
      expect(component.stringDate).toBe('05/01/2026');
    });

    it('should format as MM/DD/YYYY', () => {
      fixture.componentRef.setInput('dateFormat', 'MM/DD/YYYY');
      component.writeValue(new Date(2026, 0, 5));
      expect(component.stringDate).toBe('01/05/2026');
    });

    it('should format as YYYY/MM/DD', () => {
      fixture.componentRef.setInput('dateFormat', 'YYYY/MM/DD');
      component.writeValue(new Date(2026, 0, 5));
      expect(component.stringDate).toBe('2026/01/05');
    });

    it('should produce an empty string for null', () => {
      component.writeValue(null);
      expect(component.stringDate).toBe('');
    });
  });

  describe('Date string parsing', () => {
    it('should parse a valid DD/MM/YYYY string', () => {
      fixture.componentRef.setInput('dateFormat', 'DD/MM/YYYY');
      component.writeValue(null);
      component.onInputValueChanged('15/06/2026');
      expect(component.value).toEqual(new Date(2026, 5, 15));
    });

    it('should parse a valid MM/DD/YYYY string', () => {
      fixture.componentRef.setInput('dateFormat', 'MM/DD/YYYY');
      component.writeValue(null);
      component.onInputValueChanged('06/15/2026');
      expect(component.value).toEqual(new Date(2026, 5, 15));
    });

    it('should parse a valid YYYY/MM/DD string', () => {
      fixture.componentRef.setInput('dateFormat', 'YYYY/MM/DD');
      component.writeValue(null);
      component.onInputValueChanged('2026/06/15');
      expect(component.value).toEqual(new Date(2026, 5, 15));
    });

    it('should not update value for an invalid date string', () => {
      component.writeValue(null);
      component.onInputValueChanged('not-a-date');
      expect(component.value).toBeNull();
    });

    it('should reject an impossible day (32)', () => {
      fixture.componentRef.setInput('dateFormat', 'DD/MM/YYYY');
      component.writeValue(null);
      component.onInputValueChanged('32/01/2026');
      expect(component.value).toBeNull();
    });

    it('should clear the value for an empty string', () => {
      component.writeValue(new Date(2026, 5, 15));
      component.onInputValueChanged('');
      expect(component.value).toBeNull();
    });

    it('should still update stringDate even when date is invalid', () => {
      component.onInputValueChanged('bad-input');
      expect(component.stringDate).toBe('bad-input');
    });

    it('should not update value for a date before minDate', () => {
      fixture.componentRef.setInput('dateFormat', 'DD/MM/YYYY');
      fixture.componentRef.setInput('minDate', new Date(2026, 0, 1));
      component.writeValue(null);
      component.onInputValueChanged('31/12/2025');
      expect(component.value).toBeNull();
    });

    it('should not update value for a date after maxDate', () => {
      fixture.componentRef.setInput('dateFormat', 'DD/MM/YYYY');
      fixture.componentRef.setInput('maxDate', new Date(2026, 11, 31));
      component.writeValue(null);
      component.onInputValueChanged('01/01/2027');
      expect(component.value).toBeNull();
    });

    it('should accept a date within [minDate, maxDate]', () => {
      fixture.componentRef.setInput('dateFormat', 'DD/MM/YYYY');
      fixture.componentRef.setInput('minDate', new Date(2026, 0, 1));
      fixture.componentRef.setInput('maxDate', new Date(2026, 11, 31));
      component.writeValue(null);
      component.onInputValueChanged('15/06/2026');
      expect(component.value).toEqual(new Date(2026, 5, 15));
    });
  });

  describe('_parseFormatParts', () => {
    it('should warn and return null when date parts cannot be parsed as numbers', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      fixture.componentRef.setInput('dateFormat', 'MM/DD/YYYY');
      const result = (component as any)._parseFormatParts('aa/bb/cccc');
      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        'CpsDatepickerComponent: could not parse date string "aa/bb/cccc" using dateFormat "MM/DD/YYYY". Supported formats: DD/MM/YYYY, MM/DD/YYYY, YYYY/MM/DD.'
      );
    });

    it('should not warn for a valid date string', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      fixture.componentRef.setInput('dateFormat', 'MM/DD/YYYY');
      const result = (component as any)._parseFormatParts('06/15/2026');
      expect(result).toEqual({ day: 15, month: 6, year: 2026 });
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('_checkErrors', () => {
    it('should set error when stringDate is invalid', () => {
      component.stringDate = '99/99/9999';
      (component as any)._checkErrors();
      expect(component.error).toBe('Date is invalid');
    });

    it('should clear error when stringDate is empty', () => {
      component.error = 'Date is invalid';
      component.stringDate = '';
      (component as any)._checkErrors();
      expect(component.error).toBe('');
    });

    it('should clear error when stringDate is a valid date', () => {
      fixture.componentRef.setInput('dateFormat', 'DD/MM/YYYY');
      component.error = 'Date is invalid';
      component.stringDate = '15/06/2026';
      (component as any)._checkErrors();
      expect(component.error).toBe('');
    });

    it('should clear error when the control has not been touched', () => {
      (component as any)._control = {
        control: { touched: false },
        errors: { required: true }
      };
      (component as any)._checkErrors();
      expect(component.error).toBe('');
    });

    it('should set a required error message when touched and required', () => {
      (component as any)._control = {
        control: { touched: true },
        errors: { required: true }
      };
      (component as any)._checkErrors();
      expect(component.error).toBe('Field is required');
    });

    it('should clear error when errors object is empty', () => {
      (component as any)._control = {
        control: { touched: true },
        errors: {}
      };
      (component as any)._checkErrors();
      expect(component.error).toBe('');
    });

    it('should use a custom string error message when present', () => {
      (component as any)._control = {
        control: { touched: true },
        errors: { custom: 'Custom failure' }
      };
      (component as any)._checkErrors();
      expect(component.error).toBe('Custom failure');
    });

    it('should fall back to "Unknown error" for non-string error values', () => {
      (component as any)._control = {
        control: { touched: true },
        errors: { custom: true }
      };
      (component as any)._checkErrors();
      expect(component.error).toBe('Unknown error');
    });
  });

  describe('onInputFocus', () => {
    it('should mark the control as touched', () => {
      const markAsTouched = jest.fn();
      (component as any)._control = { control: { markAsTouched } };
      component.onInputFocus();
      expect(markAsTouched).toHaveBeenCalled();
    });

    it('should open the calendar when openOnInputFocus is true', () => {
      fixture.componentRef.setInput('openOnInputFocus', true);
      jest.spyOn(component, 'toggleCalendar').mockImplementation(() => {});
      component.onInputFocus();
      expect(component.toggleCalendar).toHaveBeenCalledWith(true);
    });

    it('should not open the calendar when openOnInputFocus is false', () => {
      fixture.componentRef.setInput('openOnInputFocus', false);
      jest.spyOn(component, 'toggleCalendar').mockImplementation(() => {});
      component.onInputFocus();
      expect(component.toggleCalendar).not.toHaveBeenCalled();
    });
  });

  describe('onInputKeydown', () => {
    it('should do nothing when the calendar is closed', () => {
      component.isOpened = false;
      jest.spyOn(component, 'toggleCalendar').mockImplementation(() => {});
      const event = keyEvent('ArrowDown', document.body);
      component.onInputKeydown(event);
      expect(component.toggleCalendar).not.toHaveBeenCalled();
    });

    it('should focus the active calendar cell on ArrowDown', () => {
      component.isOpened = true;
      const focusSpy = jest
        .spyOn(component as any, '_focusActiveCalendarCell')
        .mockImplementation(() => {});
      const event = keyEvent('ArrowDown', document.body);
      const preventSpy = jest.spyOn(event, 'preventDefault');
      component.onInputKeydown(event);
      expect(preventSpy).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should close the calendar on Tab', () => {
      component.isOpened = true;
      jest.spyOn(component, 'toggleCalendar').mockImplementation(() => {});
      const event = keyEvent('Tab', document.body);
      component.onInputKeydown(event);
      expect(component.toggleCalendar).toHaveBeenCalledWith(false);
    });

    it('should ignore unrelated keys', () => {
      component.isOpened = true;
      jest.spyOn(component, 'toggleCalendar').mockImplementation(() => {});
      const event = keyEvent('Escape', document.body);
      component.onInputKeydown(event);
      expect(component.toggleCalendar).not.toHaveBeenCalled();
    });
  });

  describe('onInputEnterClicked', () => {
    it('should do nothing when the calendar is closed', () => {
      component.isOpened = false;
      jest.spyOn(component, 'toggleCalendar').mockImplementation(() => {});
      component.onInputEnterClicked();
      expect(component.toggleCalendar).not.toHaveBeenCalled();
    });

    it('should mark touched, validate, and close the calendar', () => {
      component.isOpened = true;
      const markAsTouched = jest.fn();
      (component as any)._control = { control: { markAsTouched } };
      jest.spyOn(component, 'toggleCalendar').mockImplementation(() => {});
      component.onInputEnterClicked();
      expect(markAsTouched).toHaveBeenCalled();
      expect(component.toggleCalendar).toHaveBeenCalledWith(false);
    });
  });

  describe('onClickCalendarIcon', () => {
    it('should do nothing when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      jest.spyOn(component, 'toggleCalendar').mockImplementation(() => {});
      component.onClickCalendarIcon();
      expect(component.toggleCalendar).not.toHaveBeenCalled();
    });

    it('should update the value from input string when already open', () => {
      component.isOpened = true;
      jest.spyOn(component, 'toggleCalendar').mockImplementation(() => {});
      const updateSpy = jest.spyOn(
        component as any,
        '_updateValueFromInputString'
      );
      component.onClickCalendarIcon();
      expect(updateSpy).toHaveBeenCalled();
      expect(component.toggleCalendar).toHaveBeenCalled();
    });

    it('should request focus-on-open when closed', () => {
      component.isOpened = false;
      jest.spyOn(component, 'toggleCalendar').mockImplementation(() => {});
      component.onClickCalendarIcon();
      expect((component as any)._focusCalendarOnOpen).toBe(true);
      expect(component.toggleCalendar).toHaveBeenCalled();
    });
  });

  describe('onCalendarClick', () => {
    it('should initialize the focusable cell when in month/year view', fakeAsync(() => {
      (component as any)._datepicker = makeDp({ currentView: 'year' });
      const initSpy = jest
        .spyOn(component as any, '_initFocusableViewCell')
        .mockImplementation(() => {});
      component.onCalendarClick(new MouseEvent('click'));
      tick();
      expect(initSpy).toHaveBeenCalledWith(true);
      expect((component as any)._suppressNextContentClick).toBe(true);
    }));

    it('should do nothing when in date view', fakeAsync(() => {
      (component as any)._datepicker = makeDp({ currentView: 'date' });
      const initSpy = jest
        .spyOn(component as any, '_initFocusableViewCell')
        .mockImplementation(() => {});
      component.onCalendarClick(new MouseEvent('click'));
      tick();
      expect(initSpy).not.toHaveBeenCalled();
    }));
  });

  describe('onYearSelected', () => {
    it('should suppress next content click and init focusable cell', fakeAsync(() => {
      const initSpy = jest
        .spyOn(component as any, '_initFocusableViewCell')
        .mockImplementation(() => {});
      component.onYearSelected();
      expect((component as any)._suppressNextContentClick).toBe(true);
      tick();
      expect(initSpy).toHaveBeenCalledWith(true);
    }));
  });

  describe('_initFocusableViewCell', () => {
    it('should do nothing outside month/year views', () => {
      (component as any)._datepicker = makeDp({ currentView: 'date' });
      expect(() => (component as any)._initFocusableViewCell()).not.toThrow();
    });

    it('should set preventFocus when focus is not requested', () => {
      const dp = makeDp({ currentView: 'month' }) as any;
      dp.preventFocus = false;
      dp.initFocusableCell = jest.fn();
      (component as any)._datepicker = dp;
      (component as any)._initFocusableViewCell(false);
      expect(dp.preventFocus).toBe(true);
      expect(dp.initFocusableCell).toHaveBeenCalled();
    });

    it('should not set preventFocus when focus is requested', () => {
      const dp = makeDp({ currentView: 'year' }) as any;
      dp.preventFocus = false;
      dp.initFocusableCell = jest.fn();
      (component as any)._datepicker = dp;
      (component as any)._initFocusableViewCell(true);
      expect(dp.preventFocus).toBe(false);
      expect(dp.initFocusableCell).toHaveBeenCalled();
    });
  });

  describe('_focusActiveCalendarCell', () => {
    it('should do nothing when there is no container', () => {
      (component as any).calendarMenu = { container: null };
      expect(() => (component as any)._focusActiveCalendarCell()).not.toThrow();
    });

    it('should delegate to _initFocusableViewCell in month/year view', () => {
      (component as any).calendarMenu = {
        container: document.createElement('div')
      };
      (component as any)._datepicker = makeDp({ currentView: 'month' });
      const initSpy = jest
        .spyOn(component as any, '_initFocusableViewCell')
        .mockImplementation(() => {});
      (component as any)._focusActiveCalendarCell();
      expect(initSpy).toHaveBeenCalledWith(true);
    });

    it('should focus the cell matching the selected value', () => {
      const container = document.createElement('div');
      const span = document.createElement('span');
      span.setAttribute('data-date', '2026-5-15');
      container.appendChild(span);
      const focusSpy = jest.spyOn(span, 'focus');
      (component as any).calendarMenu = { container };
      (component as any)._datepicker = makeDp({ currentView: 'date' });
      component.writeValue(new Date(2026, 5, 15));

      (component as any)._focusActiveCalendarCell();

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
      expect(span.tabIndex).toBe(0);
    });

    it("should fall back to today's cell when no value is selected", () => {
      const container = document.createElement('div');
      const todayCell = document.createElement('td');
      todayCell.className = 'p-datepicker-today';
      const span = document.createElement('span');
      todayCell.appendChild(span);
      container.appendChild(todayCell);
      const focusSpy = jest.spyOn(span, 'focus');
      (component as any).calendarMenu = { container };
      (component as any)._datepicker = makeDp({ currentView: 'date' });
      component.writeValue(null);

      (component as any)._focusActiveCalendarCell();

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should fall back to the first available cell when there is no today cell', () => {
      const { tbody } = makeDateGrid(1, 1);
      tbody.className = 'p-datepicker-calendar';
      const container = document.createElement('div');
      container.appendChild(tbody);
      const span = tbody.querySelector('span') as HTMLElement;
      const focusSpy = jest.spyOn(span, 'focus');
      (component as any).calendarMenu = { container };
      (component as any)._datepicker = makeDp({ currentView: 'date' });
      component.writeValue(null);

      (component as any)._focusActiveCalendarCell();

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('onInputClear', () => {
    it('should focus the input when the calendar is open', () => {
      component.isOpened = true;
      const focusSpy = jest
        .spyOn(component, 'focusInput')
        .mockImplementation(() => {});
      component.onInputClear();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should not focus the input when the calendar is closed', () => {
      component.isOpened = false;
      const focusSpy = jest
        .spyOn(component, 'focusInput')
        .mockImplementation(() => {});
      component.onInputClear();
      expect(focusSpy).not.toHaveBeenCalled();
    });
  });

  describe('onCalendarContentClick', () => {
    it('should suppress the first click after a view switch', () => {
      (component as any)._suppressNextContentClick = true;
      const focusSpy = jest
        .spyOn(component, 'focusInput')
        .mockImplementation(() => {});
      component.onCalendarContentClick();
      expect((component as any)._suppressNextContentClick).toBe(false);
      expect(focusSpy).not.toHaveBeenCalled();
    });

    it('should focus the input on subsequent clicks while open', () => {
      (component as any)._suppressNextContentClick = false;
      component.isOpened = true;
      const focusSpy = jest
        .spyOn(component, 'focusInput')
        .mockImplementation(() => {});
      component.onCalendarContentClick();
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('toggleCalendar', () => {
    let inputWrap: HTMLElement;

    beforeEach(() => {
      inputWrap = document.createElement('div');
      (component as any).datepickerInput = {
        elementRef: { nativeElement: { querySelector: () => inputWrap } },
        focus: jest.fn()
      };
    });

    it('should do nothing when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      (component as any).calendarMenu = {
        show: jest.fn(),
        hide: jest.fn(),
        toggle: jest.fn(),
        isVisible: jest.fn().mockReturnValue(false)
      };
      component.toggleCalendar(true);
      expect((component as any).calendarMenu.show).not.toHaveBeenCalled();
    });

    it('should show the calendar when show is true', () => {
      const show = jest.fn();
      (component as any).calendarMenu = {
        show,
        isVisible: jest.fn().mockReturnValue(true)
      };
      component.toggleCalendar(true);
      expect(show).toHaveBeenCalledWith({ target: inputWrap });
      expect(component.isOpened).toBe(true);
    });

    it('should hide the calendar when show is false and check errors', () => {
      const hide = jest.fn();
      const markAsTouched = jest.fn();
      (component as any)._control = { control: { markAsTouched } };
      (component as any).calendarMenu = {
        hide,
        isVisible: jest.fn().mockReturnValue(false)
      };
      component.isOpened = true;
      component.toggleCalendar(false);
      expect(hide).toHaveBeenCalled();
      expect(component.isOpened).toBe(false);
      expect(markAsTouched).toHaveBeenCalled();
    });

    it('should toggle the calendar when no explicit show value is given', () => {
      const toggle = jest.fn();
      (component as any).calendarMenu = {
        toggle,
        isVisible: jest.fn().mockReturnValue(true)
      };
      component.toggleCalendar();
      expect(toggle).toHaveBeenCalledWith({ target: inputWrap });
    });

    it('should not refocus the input when needFocusInput is false', () => {
      const hide = jest.fn();
      (component as any).calendarMenu = {
        hide,
        isVisible: jest.fn().mockReturnValue(false)
      };
      component.isOpened = true;
      component.toggleCalendar(false, false);
      expect((component as any).datepickerInput.focus).not.toHaveBeenCalled();
    });
  });

  describe('onSelectCalendarDate', () => {
    it('should set the selected date as value', () => {
      const date = new Date(2026, 5, 15);
      component.onSelectCalendarDate(date);
      expect(component.value).toBe(date);
    });

    it('should emit valueChanged with the selected date', () => {
      const spy = jest.spyOn(component.valueChanged, 'emit');
      const date = new Date(2026, 5, 15);
      component.onSelectCalendarDate(date);
      expect(spy).toHaveBeenCalledWith(date);
    });

    it('should call onChange with the selected date', () => {
      const fn = jest.fn();
      component.registerOnChange(fn);
      const date = new Date(2026, 5, 15);
      component.onSelectCalendarDate(date);
      expect(fn).toHaveBeenCalledWith(date);
    });

    it('should handle null (clear)', () => {
      component.writeValue(new Date(2026, 5, 15));
      const spy = jest.spyOn(component.valueChanged, 'emit');
      component.onSelectCalendarDate(null);
      expect(component.value).toBeNull();
      expect(spy).toHaveBeenCalledWith(null);
    });
  });

  describe('onInputBlur', () => {
    it('should validate and update value when calendar is closed', () => {
      fixture.componentRef.setInput('dateFormat', 'DD/MM/YYYY');
      component.writeValue(null);
      component.stringDate = '15/06/2026';
      component.isOpened = false;
      component.onInputBlur();
      expect(component.value).toEqual(new Date(2026, 5, 15));
    });

    it('should set error for an invalid string on blur', () => {
      component.stringDate = '99/99/9999';
      component.isOpened = false;
      component.onInputBlur();
      expect(component.error).toBe('Date is invalid');
    });

    it('should do nothing when calendar is open', () => {
      component.stringDate = '99/99/9999';
      component.isOpened = true;
      component.onInputBlur();
      expect(component.error).toBe('');
    });
  });

  describe('Calendar listener management', () => {
    it('should add a capture keydown listener on the container when calendar opens', () => {
      const container = document.createElement('div');
      const addSpy = jest.spyOn(container, 'addEventListener');
      (component as any).calendarMenu = { container };
      component.onCalendarMenuShown();
      expect(addSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        true
      );
    });

    it('should store the container reference on open', () => {
      const container = document.createElement('div');
      (component as any).calendarMenu = { container };
      component.onCalendarMenuShown();
      expect((component as any)._calendarContainer).toBe(container);
    });

    it('should remove the keydown listener when calendar hides', () => {
      const container = document.createElement('div');
      (component as any)._calendarContainer = container;
      const removeSpy = jest.spyOn(container, 'removeEventListener');
      component.isOpened = false;
      component.onBeforeCalendarHidden(CpsMenuHideReason.FORCED);
      expect(removeSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        true
      );
    });

    it('should clear the container reference when calendar hides', () => {
      const container = document.createElement('div');
      (component as any)._calendarContainer = container;
      component.isOpened = false;
      component.onBeforeCalendarHidden(CpsMenuHideReason.FORCED);
      expect((component as any)._calendarContainer).toBeNull();
    });

    it('should restore focus to input when closed for non-outside reason (e.g. TOGGLE)', () => {
      const focusSpy = jest.fn();
      const inputWrap = document.createElement('div');
      (component as any).datepickerInput = {
        focus: focusSpy,
        elementRef: { nativeElement: { querySelector: () => inputWrap } }
      };
      (component as any).calendarMenu = {
        hide: jest.fn(),
        isVisible: jest.fn().mockReturnValue(false)
      };
      component.isOpened = true;
      component.onBeforeCalendarHidden(CpsMenuHideReason.TOGGLE);
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should NOT restore focus to input when closed by CLICK_OUTSIDE', () => {
      const focusSpy = jest.fn();
      const inputWrap = document.createElement('div');
      (component as any).datepickerInput = {
        focus: focusSpy,
        elementRef: { nativeElement: { querySelector: () => inputWrap } }
      };
      (component as any).calendarMenu = {
        hide: jest.fn(),
        isVisible: jest.fn().mockReturnValue(false)
      };
      component.isOpened = true;
      component.onBeforeCalendarHidden(CpsMenuHideReason.CLICK_OUTSIDE);
      expect(focusSpy).not.toHaveBeenCalled();
    });

    it('should remove the keydown listener on destroy', () => {
      const container = document.createElement('div');
      (component as any)._calendarContainer = container;
      const removeSpy = jest.spyOn(container, 'removeEventListener');
      component.ngOnDestroy();
      expect(removeSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        true
      );
    });
  });

  describe('_onCaptureKeydown: year view', () => {
    let parent: HTMLDivElement;
    let cells: HTMLSpanElement[];

    beforeEach(() => {
      parent = document.createElement('div');
      cells = Array.from({ length: 10 }, () => {
        const span = document.createElement('span');
        span.classList.add('p-datepicker-year');
        parent.appendChild(span);
        return span;
      });
    });

    function trigger(e: KeyboardEvent) {
      (component as any)._onCaptureKeydown(e);
    }

    it('should block ArrowDown when the cell two positions ahead is disabled', () => {
      cells[2].classList.add('p-disabled');
      (component as any)._datepicker = makeDp({
        currentView: 'year',
        currentYear: 2020
      });
      const event = keyEvent('ArrowDown', cells[0]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should not block ArrowDown when the cell two positions ahead is not disabled', () => {
      (component as any)._datepicker = makeDp({
        currentView: 'year',
        currentYear: 2020
      });
      const event = keyEvent('ArrowDown', cells[0]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should not block ArrowDown when there is no cell two positions ahead', () => {
      (component as any)._datepicker = makeDp({
        currentView: 'year',
        currentYear: 2020
      });
      const event = keyEvent('ArrowDown', cells[9]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should block ArrowUp when the cell two positions back is disabled', () => {
      cells[0].classList.add('p-disabled');
      (component as any)._datepicker = makeDp({
        currentView: 'year',
        currentYear: 2020
      });
      const event = keyEvent('ArrowUp', cells[2]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should not block ArrowUp when there is no cell two positions back', () => {
      (component as any)._datepicker = makeDp({
        currentView: 'year',
        currentYear: 2020
      });
      const event = keyEvent('ArrowUp', cells[0]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should block ArrowRight when the next sibling cell is disabled', () => {
      cells[3].classList.add('p-disabled');
      (component as any)._datepicker = makeDp({
        currentView: 'year',
        currentYear: 2020
      });
      const event = keyEvent('ArrowRight', cells[2]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should not block ArrowRight when the next sibling cell is not disabled', () => {
      (component as any)._datepicker = makeDp({
        currentView: 'year',
        currentYear: 2020
      });
      const event = keyEvent('ArrowRight', cells[2]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should block ArrowRight at page boundary when the next decade is fully disabled', () => {
      (component as any)._datepicker = makeDp({
        currentView: 'year',
        currentYear: 2029,
        isYearDisabled: jest.fn().mockReturnValue(true)
      });
      const event = keyEvent('ArrowRight', cells[9]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should not block ArrowRight at page boundary when the next decade has enabled years', () => {
      (component as any)._datepicker = makeDp({
        currentView: 'year',
        currentYear: 2029,
        isYearDisabled: jest.fn().mockReturnValue(false)
      });
      const event = keyEvent('ArrowRight', cells[9]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should block ArrowLeft when the previous sibling cell is disabled', () => {
      cells[1].classList.add('p-disabled');
      (component as any)._datepicker = makeDp({
        currentView: 'year',
        currentYear: 2020
      });
      const event = keyEvent('ArrowLeft', cells[2]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should block ArrowLeft at page boundary when the previous decade is fully disabled', () => {
      (component as any)._datepicker = makeDp({
        currentView: 'year',
        currentYear: 2020,
        isYearDisabled: jest.fn().mockReturnValue(true)
      });
      const event = keyEvent('ArrowLeft', cells[0]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should not block ArrowLeft at page boundary when the previous decade has enabled years', () => {
      (component as any)._datepicker = makeDp({
        currentView: 'year',
        currentYear: 2020,
        isYearDisabled: jest.fn().mockReturnValue(false)
      });
      const event = keyEvent('ArrowLeft', cells[0]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should ignore non-year-cell elements in year view', () => {
      const other = document.createElement('div');
      parent.appendChild(other);
      (component as any)._datepicker = makeDp({
        currentView: 'year',
        isYearDisabled: jest.fn().mockReturnValue(true)
      });
      const event = keyEvent('ArrowRight', other);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });
  });

  describe('_onCaptureKeydown: month view', () => {
    let parent: HTMLDivElement;
    let cells: HTMLSpanElement[];

    beforeEach(() => {
      parent = document.createElement('div');
      cells = Array.from({ length: 12 }, () => {
        const span = document.createElement('span');
        span.classList.add('p-datepicker-month');
        parent.appendChild(span);
        return span;
      });
    });

    function trigger(e: KeyboardEvent) {
      (component as any)._onCaptureKeydown(e);
    }

    it('should block ArrowDown when the cell three positions ahead is disabled', () => {
      cells[3].classList.add('p-disabled');
      (component as any)._datepicker = makeDp({
        currentView: 'month',
        currentYear: 2026
      });
      const event = keyEvent('ArrowDown', cells[0]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should not block ArrowDown when the cell three positions ahead is not disabled', () => {
      (component as any)._datepicker = makeDp({
        currentView: 'month',
        currentYear: 2026
      });
      const event = keyEvent('ArrowDown', cells[0]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should block ArrowUp when the cell three positions back is disabled', () => {
      cells[0].classList.add('p-disabled');
      (component as any)._datepicker = makeDp({
        currentView: 'month',
        currentYear: 2026
      });
      const event = keyEvent('ArrowUp', cells[3]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should block ArrowRight when the next sibling cell is disabled', () => {
      cells[5].classList.add('p-disabled');
      (component as any)._datepicker = makeDp({
        currentView: 'month',
        currentYear: 2026
      });
      const event = keyEvent('ArrowRight', cells[4]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should block ArrowRight at page boundary when the next year is disabled', () => {
      (component as any)._datepicker = makeDp({
        currentView: 'month',
        currentYear: 2026,
        isYearDisabled: jest.fn().mockReturnValue(true)
      });
      const event = keyEvent('ArrowRight', cells[11]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should not block ArrowRight at page boundary when the next year is enabled', () => {
      (component as any)._datepicker = makeDp({
        currentView: 'month',
        currentYear: 2026,
        isYearDisabled: jest.fn().mockReturnValue(false)
      });
      const event = keyEvent('ArrowRight', cells[11]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should block ArrowLeft at page boundary when the previous year is disabled', () => {
      (component as any)._datepicker = makeDp({
        currentView: 'month',
        currentYear: 2026,
        isYearDisabled: jest.fn().mockReturnValue(true)
      });
      const event = keyEvent('ArrowLeft', cells[0]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should not block ArrowLeft at page boundary when the previous year is enabled', () => {
      (component as any)._datepicker = makeDp({
        currentView: 'month',
        currentYear: 2026,
        isYearDisabled: jest.fn().mockReturnValue(false)
      });
      const event = keyEvent('ArrowLeft', cells[0]);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should ignore non-month-cell elements in month view', () => {
      const other = document.createElement('div');
      parent.appendChild(other);
      (component as any)._datepicker = makeDp({
        currentView: 'month',
        isYearDisabled: jest.fn().mockReturnValue(true)
      });
      const event = keyEvent('ArrowRight', other);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });
  });

  describe('_onCaptureKeydown: date view', () => {
    function trigger(e: KeyboardEvent) {
      (component as any)._onCaptureKeydown(e);
    }

    it('should block ArrowRight at row end when the next month is disabled', () => {
      const { rowEls } = makeDateGrid(4, 7);
      const span = (rowEls[0].children[6] as HTMLElement)
        .children[0] as HTMLElement;
      (component as any)._datepicker = makeDp({
        currentView: 'date',
        currentMonth: 11,
        currentYear: 2026,
        isMonthDisabled: jest.fn().mockReturnValue(true)
      });
      const event = keyEvent('ArrowRight', span);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should not block ArrowRight at row end when the next month is enabled', () => {
      const { rowEls } = makeDateGrid(4, 7);
      const span = (rowEls[0].children[6] as HTMLElement)
        .children[0] as HTMLElement;
      (component as any)._datepicker = makeDp({
        currentView: 'date',
        currentMonth: 5,
        currentYear: 2026,
        isMonthDisabled: jest.fn().mockReturnValue(false)
      });
      const event = keyEvent('ArrowRight', span);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should block ArrowRight when next sibling span is disabled and next month is disabled', () => {
      const { rowEls } = makeDateGrid(4, 7, [{ row: 0, col: 3 }]);
      const span = (rowEls[0].children[2] as HTMLElement)
        .children[0] as HTMLElement;
      (component as any)._datepicker = makeDp({
        currentView: 'date',
        currentMonth: 5,
        currentYear: 2026,
        isMonthDisabled: jest.fn().mockReturnValue(true)
      });
      const event = keyEvent('ArrowRight', span);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should not block ArrowRight when next sibling span is not disabled', () => {
      const { rowEls } = makeDateGrid(4, 7);
      const span = (rowEls[0].children[2] as HTMLElement)
        .children[0] as HTMLElement;
      (component as any)._datepicker = makeDp({
        currentView: 'date',
        currentMonth: 5,
        currentYear: 2026
      });
      const event = keyEvent('ArrowRight', span);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should block ArrowLeft at row start when the previous month is disabled', () => {
      const { rowEls } = makeDateGrid(4, 7);
      const span = (rowEls[0].children[0] as HTMLElement)
        .children[0] as HTMLElement;
      (component as any)._datepicker = makeDp({
        currentView: 'date',
        currentMonth: 0,
        currentYear: 2026,
        isMonthDisabled: jest.fn().mockReturnValue(true)
      });
      const event = keyEvent('ArrowLeft', span);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should check month 11 of prev year when moving left from January', () => {
      const { rowEls } = makeDateGrid(4, 7);
      const span = (rowEls[0].children[0] as HTMLElement)
        .children[0] as HTMLElement;
      const dp = makeDp({
        currentView: 'date',
        currentMonth: 0,
        currentYear: 2026,
        isMonthDisabled: jest.fn().mockReturnValue(false)
      });
      (component as any)._datepicker = dp;
      const event = keyEvent('ArrowLeft', span);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(dp.isMonthDisabled).toHaveBeenCalledWith(11, 2025);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should block ArrowDown at last row when the next month is disabled', () => {
      const { rowEls } = makeDateGrid(4, 7);
      const span = (rowEls[3].children[3] as HTMLElement)
        .children[0] as HTMLElement;
      (component as any)._datepicker = makeDp({
        currentView: 'date',
        currentMonth: 5,
        currentYear: 2026,
        isMonthDisabled: jest.fn().mockReturnValue(true)
      });
      const event = keyEvent('ArrowDown', span);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should block ArrowDown when adjacent row cell is disabled and next month is disabled', () => {
      const { rowEls } = makeDateGrid(4, 7, [{ row: 2, col: 3 }]);
      const span = (rowEls[1].children[3] as HTMLElement)
        .children[0] as HTMLElement;
      (component as any)._datepicker = makeDp({
        currentView: 'date',
        currentMonth: 5,
        currentYear: 2026,
        isMonthDisabled: jest.fn().mockReturnValue(true)
      });
      const event = keyEvent('ArrowDown', span);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should not block ArrowDown when adjacent row cell is not disabled', () => {
      const { rowEls } = makeDateGrid(4, 7);
      const span = (rowEls[1].children[3] as HTMLElement)
        .children[0] as HTMLElement;
      (component as any)._datepicker = makeDp({
        currentView: 'date',
        currentMonth: 5,
        currentYear: 2026
      });
      const event = keyEvent('ArrowDown', span);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should block ArrowUp at first row when the previous month is disabled', () => {
      const { rowEls } = makeDateGrid(4, 7);
      const span = (rowEls[0].children[3] as HTMLElement)
        .children[0] as HTMLElement;
      (component as any)._datepicker = makeDp({
        currentView: 'date',
        currentMonth: 5,
        currentYear: 2026,
        isMonthDisabled: jest.fn().mockReturnValue(true)
      });
      const event = keyEvent('ArrowUp', span);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(true);
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should check month 0 of next year when moving right from December', () => {
      const { rowEls } = makeDateGrid(4, 7);
      const span = (rowEls[0].children[6] as HTMLElement)
        .children[0] as HTMLElement;
      const dp = makeDp({
        currentView: 'date',
        currentMonth: 11,
        currentYear: 2026,
        isMonthDisabled: jest.fn().mockReturnValue(false)
      });
      (component as any)._datepicker = dp;
      const event = keyEvent('ArrowRight', span);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(dp.isMonthDisabled).toHaveBeenCalledWith(0, 2027);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should ignore elements without a data-date attribute', () => {
      const div = document.createElement('div');
      (component as any)._datepicker = makeDp({
        currentView: 'date',
        isMonthDisabled: jest.fn().mockReturnValue(true)
      });
      const event = keyEvent('ArrowRight', div);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });

    it('should ignore non-arrow keys', () => {
      const { rowEls } = makeDateGrid(4, 7);
      const span = (rowEls[0].children[6] as HTMLElement)
        .children[0] as HTMLElement;
      (component as any)._datepicker = makeDp({
        currentView: 'date',
        isMonthDisabled: jest.fn().mockReturnValue(true)
      });
      const event = keyEvent('Enter', span);
      const stopSpy = jest.spyOn(event, 'stopImmediatePropagation');
      trigger(event);
      expect(event.defaultPrevented).toBe(false);
      expect(stopSpy).not.toHaveBeenCalled();
    });
  });

  describe('onDatepickerMonthChange', () => {
    it('should focus the prev-month button when nav was backward via button', fakeAsync(() => {
      const prevBtn = document.createElement('button');
      prevBtn.classList.add('p-datepicker-prev-button');
      const container = document.createElement('div');
      container.appendChild(prevBtn);
      const focusSpy = jest.spyOn(prevBtn, 'focus');
      (component as any)._datepicker = makeDp({
        navigationState: { backward: true, button: true }
      });
      (component as any).calendarMenu = { container };
      component.onDatepickerMonthChange();
      tick();
      expect(focusSpy).toHaveBeenCalled();
    }));

    it('should focus the next-month button when nav was forward via button', fakeAsync(() => {
      const nextBtn = document.createElement('button');
      nextBtn.classList.add('p-datepicker-next-button');
      const container = document.createElement('div');
      container.appendChild(nextBtn);
      const focusSpy = jest.spyOn(nextBtn, 'focus');
      (component as any)._datepicker = makeDp({
        navigationState: { backward: false, button: true }
      });
      (component as any).calendarMenu = { container };
      component.onDatepickerMonthChange();
      tick();
      expect(focusSpy).toHaveBeenCalled();
    }));

    it('should focus the first available day cell for forward keyboard navigation', fakeAsync(() => {
      const span = document.createElement('span');
      span.setAttribute('data-date', '2026-6-1');
      const td = document.createElement('td');
      td.appendChild(span);
      const table = document.createElement('table');
      table.classList.add('p-datepicker-calendar');
      const tbody = document.createElement('tbody');
      const tr = document.createElement('tr');
      tr.appendChild(td);
      tbody.appendChild(tr);
      table.appendChild(tbody);
      const container = document.createElement('div');
      container.appendChild(table);
      const focusSpy = jest.spyOn(span, 'focus');
      (component as any)._datepicker = makeDp({
        navigationState: { backward: false }
      });
      (component as any).calendarMenu = { container };
      component.onDatepickerMonthChange();
      tick();
      expect(focusSpy).toHaveBeenCalled();
    }));

    it('should focus the last available day cell for backward keyboard navigation', fakeAsync(() => {
      const span1 = document.createElement('span');
      span1.setAttribute('data-date', '2026-5-1');
      const span2 = document.createElement('span');
      span2.setAttribute('data-date', '2026-5-31');
      const td1 = document.createElement('td');
      td1.appendChild(span1);
      const td2 = document.createElement('td');
      td2.appendChild(span2);
      const table = document.createElement('table');
      table.classList.add('p-datepicker-calendar');
      const tbody = document.createElement('tbody');
      const tr = document.createElement('tr');
      tr.appendChild(td1);
      tr.appendChild(td2);
      tbody.appendChild(tr);
      table.appendChild(tbody);
      const container = document.createElement('div');
      container.appendChild(table);
      const focusSpy = jest.spyOn(span2, 'focus');
      (component as any)._datepicker = makeDp({
        navigationState: { backward: true }
      });
      (component as any).calendarMenu = { container };
      component.onDatepickerMonthChange();
      tick();
      expect(focusSpy).toHaveBeenCalled();
    }));

    it('should focus the cell matching an explicit focusKey', fakeAsync(() => {
      const span = document.createElement('span');
      span.setAttribute('data-date', '2026-6-10');
      const container = document.createElement('div');
      container.appendChild(span);
      const focusSpy = jest.spyOn(span, 'focus');
      (component as any)._datepicker = makeDp({
        navigationState: {},
        _focusKey: 'span[data-date="2026-6-10"]'
      });
      (component as any).calendarMenu = { container };
      component.onDatepickerMonthChange();
      tick();
      expect(focusSpy).toHaveBeenCalled();
    }));

    it('should do nothing when there is no calendar container', fakeAsync(() => {
      (component as any)._datepicker = makeDp({ navigationState: null });
      (component as any).calendarMenu = { container: null };
      expect(() => {
        component.onDatepickerMonthChange();
        tick();
      }).not.toThrow();
    }));
  });
});
