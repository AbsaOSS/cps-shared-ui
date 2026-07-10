import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  PLATFORM_ID,
  Self,
  ViewChild,
  type SimpleChanges
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ControlValueAccessor, NgControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  convertSize,
  parseSize
} from '../../utils/internal/size-utils/size-utils';
import { CpsIconComponent } from '../cps-icon/cps-icon.component';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import { CpsTooltipPosition } from '../../directives/cps-tooltip/cps-tooltip.directive';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../services/cps-root-font-size/cps-root-font-size.service';
import {
  generateUniqueId,
  logMissingAriaLabelError
} from '../../utils/internal/accessibility-utils/accessibility-utils';

const RESIZE_STEP_REM = 1.5;

/**
 * CpsTextareaComponent is a textarea component.
 * @group Components
 */
@Component({
  selector: 'cps-textarea',
  imports: [CommonModule, CpsIconComponent, CpsInfoCircleComponent],
  templateUrl: './cps-textarea.component.html',
  styleUrls: ['./cps-textarea.component.scss']
})
export class CpsTextareaComponent
  implements ControlValueAccessor, OnInit, OnChanges, OnDestroy, AfterViewInit
{
  /**
   * Label of the textarea.
   * @group Props
   */
  @Input() label = '';

  /**
   * Aria label for the textarea component, used for accessibility, it takes precedence over label.
   * @group Props
   */
  @Input() ariaLabel = '';

  /**
   * Placeholder text for the textarea.
   * @group Props
   */
  @Input() placeholder = 'Please enter';

  /**
   * Number of rows in the textarea.
   * @group Props
   */
  @Input() rows = 5;

  /**
   * The cols attribute specifies the visible width of a textarea.
   * @group Props
   */
  @Input() cols = 20;

  /**
   * Determines whether the textarea can auto focus.
   * @group Props
   */
  @Input() autofocus = false;

  /**
   * Determines whether the value of the textarea may be checked for spelling errors.
   * @group Props
   */
  @Input() spellcheck = false;

  /**
   * Determines whether the value of the textarea can be automatically completed by the browser.
   * @group Props
   */
  @Input() autocomplete: string = 'off';

  /**
   * Bottom hint text for the textarea.
   * @group Props
   */
  @Input() hint = '';

  /**
   * Determines whether the textarea is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Determines whether the textarea is readonly.
   * @group Props
   */
  @Input() readonly = false;

  /**
   * Width of the textarea, it can be of type number denoting pixels or string.
   * @group Props
   */
  @Input() width: number | string = '100%';

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
   * Determines whether the textarea should have persistent clear icon.
   * @group Props
   */
  @Input() persistentClear = false;

  /**
   * Error message.
   * @group Props
   */
  @Input() error = '';

  /**
   * Determines whether the component can be resized vertically or not.
   * @group Props
   */
  @Input() resizable: 'vertical' | 'none' = 'vertical';

  /**
   * Maximum height of the textarea during resize, of type number denoting pixels or string.
   * Accepts only units of px, rem and em. When resizable is set to 'none', this prop has no effect.
   * @group Props
   */
  @Input() maxHeight: number | string = Infinity;

  /**
   * When it is not an empty string, an info icon is displayed to show text for more info.
   * @group Props
   */
  @Input() infoTooltip = '';

  /**
   * Info tooltip class for styling.
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
   * Value of the textarea.
   * @default ''
   * @group Props
   */
  @Input() set value(value: string) {
    if (!value) value = '';
    this._value = value;
    this.onChange(value);
  }

  get value(): string {
    return this._value;
  }

  /**
   * Callback to invoke on value change.
   * @param {string} string - value changed.
   * @group Emits
   */
  @Output() valueChanged = new EventEmitter<string>();

  /**
   * Callback to invoke when the component receives focus.
   * @param {any}
   * @group Emits
   */
  @Output() focused = new EventEmitter();

  /**
   * Callback to invoke when the prefixIcon is clicked.
   * @param {any}
   * @group Emits
   */
  @Output() prefixIconClicked = new EventEmitter();

  /**
   * Callback to invoke when the component loses focus.
   * @param {any}
   * @group Emits
   */
  @Output() blurred = new EventEmitter();

  @ViewChild('textareaEl')
  private _textareaEl?: ElementRef<HTMLTextAreaElement>;

  private _statusChangesSubscription?: Subscription;
  private _value = '';

  readonly hintId = generateUniqueId('cps-textarea-hint');
  readonly errorId = generateUniqueId('cps-textarea-error');

  get describedBy(): string | null {
    if (this.hideDetails) return null;
    if (this.error) return this.errorId;
    if (this.hint) return this.hintId;
    return null;
  }

  cvtWidth = '';
  maxHeightPx: number | null = null;
  isKeyboardFocused = false;

  private _singleRowHeightPx = 0;
  private _mouseActivated = false;

  private readonly _cpsRootFontSizeService = inject(CPS_ROOT_FONT_SIZE_SERVICE);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _resizeStepPx = computed(
    () => RESIZE_STEP_REM * (this._cpsRootFontSizeService?.fontSize() || 16)
  );

  constructor(
    @Self() @Optional() private _control: NgControl,
    private _elementRef: ElementRef<HTMLElement>
  ) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
    effect(() => this._updateMaxHeight());
  }

  ngOnInit(): void {
    this.cvtWidth = convertSize(this.width);

    this._statusChangesSubscription = this._control?.statusChanges?.subscribe(
      () => {
        this._checkErrors();
      }
    );
    logMissingAriaLabelError(
      'CpsTextareaComponent',
      this.label,
      this.ariaLabel
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.width) {
      this.cvtWidth = convertSize(this.width);
    }
    if (changes.maxHeight || changes.resizable) {
      this._updateMaxHeight();
    }
    logMissingAriaLabelError(
      'CpsTextareaComponent',
      this.label,
      this.ariaLabel
    );
  }

  ngAfterViewInit(): void {
    if (this.resizable === 'vertical') {
      const textarea = this._textareaEl?.nativeElement;
      if (textarea) {
        this._singleRowHeightPx = textarea.offsetHeight / this.rows;
      }
    }
  }

  ngOnDestroy() {
    this._statusChangesSubscription?.unsubscribe();
  }

  private _updateMaxHeight(): void {
    if (this.resizable !== 'vertical' || this.maxHeight === Infinity) {
      this.maxHeightPx = null;
      return;
    }
    const css = convertSize(this.maxHeight);
    const parsed = parseSize(css);
    if (!parsed) throw new Error(`Unsupported value for maxHeight.`);
    const rootFontSizePx = this._cpsRootFontSizeService?.fontSize() || 16;
    if (parsed.unit === 'px') {
      this.maxHeightPx = parsed.value;
    } else if (parsed.unit === 'rem') {
      this.maxHeightPx = parsed.value * rootFontSizePx;
    } else if (parsed.unit === 'em') {
      const emBase = isPlatformBrowser(this._platformId)
        ? parseFloat(
            getComputedStyle(this._elementRef.nativeElement).fontSize || '16'
          )
        : rootFontSizePx;
      this.maxHeightPx = parsed.value * emBase;
    } else {
      throw new Error(`Unsupported unit "${parsed.unit}" for maxHeight.`);
    }
  }

  private _checkErrors() {
    if (!this._control) return;
    const errors = this._control?.errors;

    if (!this._control?.control?.touched || !errors) {
      this.error = '';
      return;
    }

    if ('required' in errors) {
      this.error = 'Field is required';
      return;
    }

    if ('pattern' in errors) {
      this.error = 'Value is invalid';
      return;
    }

    if ('minlength' in errors) {
      // eslint-disable-next-line dot-notation
      this.error = `Field must contain at least ${errors['minlength'].requiredLength} characters`;
      return;
    }

    if ('maxlength' in errors) {
      // eslint-disable-next-line dot-notation
      this.error = `Field must contain ${errors['maxlength'].requiredLength} characters maximum`;
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

  get isRequired(): boolean {
    return this._control?.control?.hasValidator(Validators.required) ?? false;
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

  writeValue(value: string) {
    this.value = value;
  }

  updateValueEvent(event: any) {
    const value = event?.target?.value || '';
    this._updateValue(value);
  }

  private _updateValue(value: string) {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  clear() {
    if (this.value !== '') this._updateValue('');
  }

  onClear(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.clear();
    this.focus();
  }

  get isClearButtonVisible(): boolean {
    return this.persistentClear || !!this.value;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(_disabled: boolean) {}

  onBlur() {
    this.isKeyboardFocused = false;
    this._checkErrors();
    this.blurred.emit();
  }

  onFocus() {
    this.isKeyboardFocused = !this._mouseActivated;
    this._mouseActivated = false;
    this._control?.control?.markAsTouched();
    this.focused.emit();
  }

  onTextareaMousedown() {
    this._mouseActivated = true;
  }

  focus() {
    this._textareaEl?.nativeElement?.focus();
  }

  onResizeHandleKeydown(event: KeyboardEvent): void {
    const textarea = this._textareaEl?.nativeElement;
    if (!textarea) return;

    const current = textarea.offsetHeight;
    let next = current;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        next = Math.max(
          current - this._resizeStepPx(),
          this._singleRowHeightPx
        );
        break;
      case 'ArrowDown':
        event.preventDefault();
        next = Math.min(
          current + this._resizeStepPx(),
          this.maxHeightPx ?? Infinity
        );
        break;
      default:
        return;
    }

    textarea.style.height = `${next}px`;
  }
}
