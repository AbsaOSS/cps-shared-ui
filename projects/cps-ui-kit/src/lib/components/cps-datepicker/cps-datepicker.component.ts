import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self,
  type SimpleChanges,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { CpsInputComponent } from '../cps-input/cps-input.component';
import { Subscription } from 'rxjs';
import { convertSize } from '../../utils/internal/size-utils/size-utils';
import { CpsTooltipPosition } from '../../directives/cps-tooltip/cps-tooltip.directive';
import {
  CpsMenuComponent,
  CpsMenuHideReason
} from '../cps-menu/cps-menu.component';
import {
  DatePicker,
  DatePickerModule
} from '../../primeng-temp/datepicker/public_api';
import {
  logMissingAriaLabelError,
  generateUniqueId
} from '../../utils/internal/accessibility-utils/accessibility-utils';

/**
 * CpsDatepickerAppearanceType is used to define the border of the datepicker input.
 * @group Types
 */
export type CpsDatepickerAppearanceType =
  | 'outlined'
  | 'underlined'
  | 'borderless';

/**
 * CpsDatepickerDateFormat defines the display and input format of the date string.
 * @group Types
 */
export type CpsDatepickerDateFormat =
  | 'DD/MM/YYYY'
  | 'MM/DD/YYYY'
  | 'YYYY/MM/DD';

/**
 * CpsDatepickerComponent is an input component to provide date input.
 * @group Components
 */
@Component({
  imports: [
    CpsInputComponent,
    DatePickerModule,
    CommonModule,
    FormsModule,
    CpsMenuComponent
  ],
  selector: 'cps-datepicker',
  templateUrl: './cps-datepicker.component.html',
  styleUrls: ['./cps-datepicker.component.scss']
})
export class CpsDatepickerComponent
  implements ControlValueAccessor, OnInit, OnChanges, OnDestroy
{
  /**
   * Label of the datepicker element.
   * @group Props
   */
  @Input() label = '';

  /**
   * Aria label for the datepicker component, used for accessibility, it takes precedence over label.
   * @group Props
   */
  @Input() ariaLabel = '';

  /**
   * Determines whether datepicker is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Width of the datepicker of type number denoting pixels or string.
   * @group Props
   */
  @Input() width: number | string = '100%';

  /**
   * Date format for displaying and parsing the date string.
   * @group Props
   */
  @Input() dateFormat: CpsDatepickerDateFormat = 'DD/MM/YYYY';

  /**
   * Placeholder text. Defaults to the configured dateFormat.
   * @group Props
   */
  @Input() placeholder = '';

  /**
   * Bottom hint text for the input field.
   * @group Props
   */
  @Input() hint = '';

  /**
   * When enabled, a clear icon is displayed to clear the value.
   * @group Props
   */
  @Input() clearable = false;

  /**
   * Hides hint and validation errors.
   * @group Props
   */
  @Input() hideDetails = false;

  /**
   * Determines whether the component should have persistent clear icon.
   * @group Props
   */
  @Input() persistentClear = false;

  /**
   * Determines whether to show button to be able to select today's date.
   * @group Props
   */
  @Input() showTodayButton = true;

  /**
   * Determines whether the datepicker dropdown should open on input focus.
   * @group Props
   */
  @Input() openOnInputFocus = false;

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
   * Size of infoTooltip, of type number denoting pixels or string.
   * @group Props
   */
  @Input() infoTooltipMaxWidth: number | string = '100%';

  /**
   * Determines whether the infoTooltip is persistent.
   * @group Props
   */
  @Input() infoTooltipPersistent = false;

  /**
   * Position of infoTooltip, it can be "top", "bottom", "left" or "right".
   * @group Props
   */
  @Input() infoTooltipPosition: CpsTooltipPosition = 'top';

  /**
   * Styling appearance of datepicker input, it can be 'outlined', 'underlined' or 'borderless.
   * @group Props
   */
  @Input() appearance: CpsDatepickerAppearanceType = 'outlined';

  /**
   * Minimal date availalbe for selection.
   * @group Props
   */
  @Input() minDate: Date | undefined;

  /**
   * Maximal date availalbe for selection.
   * @group Props
   */
  @Input() maxDate: Date | undefined;

  /**
   * Value of the datepicker.
   * @default null
   * @group Props
   */
  @Input() set value(value: Date | null) {
    this._value = value;
    this.stringDate = this._dateToString(value);
    this.onChange(value);
  }

  get value(): Date | null {
    return this._value;
  }

  /**
   * Callback to invoke on value change.
   * @param {Date | null} value - value change.
   * @group Emits
   */
  @Output() valueChanged = new EventEmitter<Date | null>();

  @ViewChild('datepickerInput')
  datepickerInput!: CpsInputComponent;

  @ViewChild('calendarMenu')
  calendarMenu!: CpsMenuComponent;

  @ViewChild(DatePicker)
  private _datepicker!: DatePicker;

  readonly calendarId = generateUniqueId('cps-datepicker-calendar');

  stringDate = '';
  isOpened = false;
  error = '';
  cvtWidth = '';

  private _statusChangesSubscription?: Subscription;
  private _value: Date | null = null;
  private _focusCalendarOnOpen = false;
  private _suppressNextContentClick = false;
  private _captureKeydown = (e: KeyboardEvent) => this._onCaptureKeydown(e);
  private _calendarContainer: HTMLElement | null = null;

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
    );

    logMissingAriaLabelError(
      'CpsDatepickerComponent',
      this.label,
      this.ariaLabel
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.width) {
      this.cvtWidth = convertSize(this.width);
    }

    if (changes.dateFormat && !changes.dateFormat.isFirstChange()) {
      this.stringDate = this._dateToString(this._value);
    }

    logMissingAriaLabelError(
      'CpsDatepickerComponent',
      this.label,
      this.ariaLabel
    );
  }

  ngOnDestroy() {
    this._statusChangesSubscription?.unsubscribe();
    this._removeCalendarListeners();
  }

  private _removeCalendarListeners(): void {
    this._calendarContainer?.removeEventListener(
      'keydown',
      this._captureKeydown,
      true
    );
  }

  // PrimeNG's own keyboard handler does not check whether the destination cell
  // is disabled before moving focus. This capture-phase listener intercepts
  // arrow keys and swallows them when:
  //   - the target cell in the month/year grid is disabled, or
  //   - the keypress would cross a page boundary (next/prev decade, year, or
  //     month) where every cell on the adjacent page is also disabled.
  private _onCaptureKeydown(event: KeyboardEvent): void {
    const { key } = event;
    const isLeft = key === 'ArrowLeft';
    const isUp = key === 'ArrowUp';
    const isHorizontal = isLeft || key === 'ArrowRight';
    const isVertical = isUp || key === 'ArrowDown';
    if (!isHorizontal && !isVertical) return;

    const view = this._datepicker?.currentView;
    const target = event.target as HTMLElement;
    const dp = this._datepicker;
    const isBackward = isLeft || isUp;
    let blocked = false;

    if (view === 'month' || view === 'year') {
      const cellClass =
        view === 'year' ? 'p-datepicker-year' : 'p-datepicker-month';
      if (!target.classList.contains(cellClass)) return;

      if (isVertical) {
        const cells = Array.from(target.parentElement?.children ?? []);
        const step = view === 'year' ? 2 : 3;
        const dest = cells[cells.indexOf(target) + (isUp ? -step : step)] as
          | HTMLElement
          | undefined;
        blocked = !!dest?.classList.contains('p-disabled');
      } else {
        const sibling = (
          isLeft ? target.previousElementSibling : target.nextElementSibling
        ) as HTMLElement | null;
        if (sibling) {
          blocked = sibling.classList.contains('p-disabled');
        } else if (view === 'year') {
          const base = dp.currentYear - (dp.currentYear % 10);
          const start = isBackward ? base - 10 : base + 10;
          blocked = Array.from({ length: 10 }, (_, i) => start + i).every(
            (y): boolean => dp.isYearDisabled(y)
          );
        } else {
          blocked = dp.isYearDisabled(
            isBackward ? dp.currentYear - 1 : dp.currentYear + 1
          );
        }
      }
    } else if (view === 'date') {
      if (!target.hasAttribute('data-date')) return;
      const cell = target.parentElement;
      let crossMonth: boolean;
      if (isHorizontal) {
        const sibling = isLeft
          ? cell?.previousElementSibling
          : cell?.nextElementSibling;
        crossMonth =
          !sibling || !!sibling.children[0]?.classList.contains('p-disabled');
      } else {
        const cellIndex = Array.from(
          cell?.parentElement?.children ?? []
        ).indexOf(cell as Element);
        const adjRow = isUp
          ? cell?.parentElement?.previousElementSibling
          : cell?.parentElement?.nextElementSibling;
        crossMonth =
          !adjRow ||
          !!adjRow.children[cellIndex]?.children[0]?.classList.contains(
            'p-disabled'
          );
      }
      if (!crossMonth) return;
      const adj = new Date(
        dp.currentYear,
        (dp.currentMonth as number) + (isBackward ? -1 : 1),
        1
      );
      blocked = dp.isMonthDisabled(adj.getMonth(), adj.getFullYear());
    }

    if (blocked) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChange = (_event: any) => {};

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

  private _parseFormatParts(
    dateString: string
  ): { day: number; month: number; year: number } | null {
    const parts = dateString.split('/').map((p) => parseInt(p, 10));
    if (parts.some(isNaN)) {
      console.warn(
        `CpsDatepickerComponent: could not parse date string "${dateString}" using dateFormat "${this.dateFormat}". Supported formats: DD/MM/YYYY, MM/DD/YYYY, YYYY/MM/DD.`
      );
      return null;
    }
    switch (this.dateFormat) {
      case 'DD/MM/YYYY':
        return { day: parts[0], month: parts[1], year: parts[2] };
      case 'MM/DD/YYYY':
        return { day: parts[1], month: parts[0], year: parts[2] };
      case 'YYYY/MM/DD':
        return { day: parts[2], month: parts[1], year: parts[0] };
    }
  }

  private _checkDateFormat(dateString: string): boolean {
    const regex =
      this.dateFormat === 'YYYY/MM/DD'
        ? /^\d{4}\/\d{2}\/\d{2}$/
        : /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(dateString)) return false;
    const parsed = this._parseFormatParts(dateString);
    if (!parsed) return false;
    const { day, month, year } = parsed;
    const d = new Date(year, month - 1, day);
    return (
      d.getMonth() === month - 1 &&
      d.getDate() === day &&
      d.getFullYear() === year
    );
  }

  private _checkDateInRange(
    date: Date,
    minDate?: Date,
    maxDate?: Date
  ): boolean {
    if (minDate && date.getTime() < minDate.getTime()) return false;
    if (maxDate && date.getTime() > maxDate.getTime()) return false;
    return true;
  }

  private _dateToString(dateVal: Date | null): string {
    if (!dateVal) return '';
    const mm = String(dateVal.getMonth() + 1).padStart(2, '0');
    const dd = String(dateVal.getDate()).padStart(2, '0');
    const yyyy = String(dateVal.getFullYear());
    switch (this.dateFormat) {
      case 'DD/MM/YYYY':
        return `${dd}/${mm}/${yyyy}`;
      case 'MM/DD/YYYY':
        return `${mm}/${dd}/${yyyy}`;
      case 'YYYY/MM/DD':
        return `${yyyy}/${mm}/${dd}`;
    }
  }

  private _stringToDate(dateString: string): Date | null {
    if (!this._checkDateFormat(dateString)) return null;
    const parsed = this._parseFormatParts(dateString);
    if (!parsed) return null;
    const { day, month, year } = parsed;
    const dt = new Date(year, month - 1, day);
    return this._checkDateInRange(dt, this.minDate, this.maxDate) ? dt : null;
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

  onSelectCalendarDate(dateVal: Date | null) {
    this.toggleCalendar(false);
    this.writeValue(dateVal);
    this.onChange(dateVal);
    this.valueChanged.emit(dateVal);
  }

  onInputBlur() {
    if (this.isOpened) return;
    this._updateValueFromInputString();
    this._checkErrors();
  }

  onInputFocus() {
    this._control?.control?.markAsTouched();
    if (this.openOnInputFocus) this.toggleCalendar(true);
  }

  onInputKeydown(event: KeyboardEvent) {
    if (!this.isOpened) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._focusActiveCalendarCell();
    } else if (event.key === 'Tab') {
      this.toggleCalendar(false);
    }
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
    else this._focusCalendarOnOpen = true;
    this.toggleCalendar();
  }

  onCalendarClick(_event: MouseEvent): void {
    // Handles view switches triggered by the Month/Year title buttons in the
    // header (PrimeNG does not call initFocusableCell() after setCurrentView()).
    // Year-cell clicks are also covered by onYearSelected(), but calling
    // _initFocusableViewCell twice is harmless since it is idempotent.
    setTimeout(() => {
      const view = this._datepicker?.currentView;
      if (view !== 'month' && view !== 'year') return;
      this._suppressNextContentClick = true;
      this._initFocusableViewCell(true);
    });
  }

  onYearSelected(): void {
    // Fired by PrimeNG when a year cell is clicked and the view switches to
    // 'month'. At this point currentView is already 'month' but Zone's tick()
    // may not have run yet. Use setTimeout so we run after Angular re-renders.
    this._suppressNextContentClick = true;
    setTimeout(() => this._initFocusableViewCell(true));
  }

  private _initFocusableViewCell(focus = false): void {
    const view = this._datepicker?.currentView;
    if (view !== 'year' && view !== 'month') return;
    // Delegate to PrimeNG's own initFocusableCell which uses contentViewChild
    // (the correct root element). Suppress its built-in focus unless requested;
    // PrimeNG resets preventFocus = false at the end of that method.
    if (!focus) this._datepicker.preventFocus = true;
    this._datepicker.initFocusableCell();
  }

  onCalendarMenuShown() {
    this._calendarContainer = this.calendarMenu.container ?? null;
    this._calendarContainer?.addEventListener(
      'keydown',
      this._captureKeydown,
      true
    );
    if (!this._focusCalendarOnOpen) return;
    this._focusCalendarOnOpen = false;
    // setTimeout fires after requestAnimationFrame, ensuring p-motion has
    // already removed its initial display:none from the calendar panel.
    setTimeout(() => this._focusActiveCalendarCell());
  }

  private _focusActiveCalendarCell(): void {
    const container = this.calendarMenu.container;
    if (!container) return;

    const view = this._datepicker?.currentView;
    if (view === 'month' || view === 'year') {
      this._initFocusableViewCell(true);
      return;
    }

    // Build a [data-date] key for the selected date using PrimeNG's format
    // (YYYY-M-D, no zero-padding) to query directly rather than relying on the
    // p-datepicker-day-selected class, which may not be rendered yet due to
    // PrimeNG's OnPush change detection cycle.
    let cell: HTMLElement | null = null;
    if (this.value) {
      const key = `${this.value.getFullYear()}-${this.value.getMonth()}-${this.value.getDate()}`;
      cell = container.querySelector<HTMLElement>(
        `span[data-date="${key}"]:not(.p-disabled)`
      );
    }

    // Fallback: today's cell, then first available cell
    cell ??=
      container.querySelector<HTMLElement>(
        'td.p-datepicker-today span:not(.p-disabled):not(.p-ink)'
      ) ??
      container.querySelector<HTMLElement>(
        '.p-datepicker-calendar td span:not(.p-disabled):not(.p-ink)'
      );

    if (cell) {
      cell.tabIndex = 0;
      cell.focus({ preventScroll: true });
    }
  }

  onDatepickerMonthChange(): void {
    const navState = this._datepicker?.navigationState;
    const focusKey = this._datepicker?._focusKey ?? null;

    // Wait for Angular to re-render the new month's *ngFor cells, then focus.
    setTimeout(() => {
      const container = this.calendarMenu.container;
      if (!container) return;

      // Prevent PrimeNG from double-handling focus since we do it here.
      if (this._datepicker) {
        this._datepicker.navigationState = null;
        this._datepicker._focusKey = null;
      }

      if (navState?.button) {
        // Nav button was activated - return focus to prev/next month button.
        const btnClass = navState.backward
          ? '.p-datepicker-prev-button'
          : '.p-datepicker-next-button';
        container.querySelector<HTMLElement>(btnClass)?.focus();
      } else {
        // Keyboard boundary navigation — focus the appropriate day cell.
        let cell: HTMLElement | null = null;
        if (focusKey) {
          cell = container.querySelector<HTMLElement>(focusKey);
        } else if (navState?.backward) {
          const cells = container.querySelectorAll<HTMLElement>(
            '.p-datepicker-calendar td span:not(.p-disabled):not(.p-ink)'
          );
          cell = cells[cells.length - 1] ?? null;
        } else {
          cell = container.querySelector<HTMLElement>(
            '.p-datepicker-calendar td span:not(.p-disabled):not(.p-ink)'
          );
        }
        if (cell) {
          cell.tabIndex = 0;
          cell.focus({ preventScroll: true });
        }
      }
    });
  }

  onBeforeCalendarHidden(reason: CpsMenuHideReason) {
    this._removeCalendarListeners();
    this._calendarContainer = null;
    if (this.disabled || !this.isOpened) return;
    this._updateValueFromInputString();
    this.toggleCalendar(false, reason !== CpsMenuHideReason.CLICK_OUTSIDE);
  }

  onInputClear() {
    if (this.isOpened) this.focusInput();
  }

  onCalendarContentClick() {
    if (this._suppressNextContentClick) {
      this._suppressNextContentClick = false;
      return;
    }
    if (this.isOpened) this.focusInput();
  }

  focusInput() {
    this.datepickerInput.focus();
  }

  toggleCalendar(show?: boolean, needFocusInput = true) {
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
      if (needFocusInput) this.focusInput();
    }
  }
}
