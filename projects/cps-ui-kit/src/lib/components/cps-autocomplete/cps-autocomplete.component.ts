import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
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
import { Subscription } from 'rxjs';
import { convertSize } from '../../utils/internal/size-utils';
import {
  CpsIconComponent,
  IconType,
  iconSizeType
} from '../cps-icon/cps-icon.component';
import { CpsChipComponent } from '../cps-chip/cps-chip.component';
import { CpsProgressLinearComponent } from '../cps-progress-linear/cps-progress-linear.component';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import { LabelByValuePipe } from '../../pipes/internal/label-by-value.pipe';
import { CheckOptionSelectedPipe } from '../../pipes/internal/check-option-selected.pipe';
import { isEqual } from 'lodash-es';
import {
  VirtualScroller,
  VirtualScrollerModule
} from 'primeng/virtualscroller';
import { CpsTooltipPosition } from '../../directives/cps-tooltip/cps-tooltip.directive';
import { CpsMenuComponent } from '../cps-menu/cps-menu.component';

export type CpsAutocompleteAppearanceType =
  | 'outlined'
  | 'underlined'
  | 'borderless';

/**
 * CpsAutocompleteComponent is an input component that provides real-time suggestions when being typed.
 * @group Components
 */
@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CpsIconComponent,
    CpsChipComponent,
    CpsProgressLinearComponent,
    CpsInfoCircleComponent,
    LabelByValuePipe,
    CheckOptionSelectedPipe,
    VirtualScrollerModule,
    CpsMenuComponent
  ],
  providers: [LabelByValuePipe, CheckOptionSelectedPipe],
  selector: 'cps-autocomplete',
  templateUrl: './cps-autocomplete.component.html',
  styleUrls: ['./cps-autocomplete.component.scss']
})
export class CpsAutocompleteComponent
  implements ControlValueAccessor, OnInit, AfterViewInit, OnDestroy
{
  /**
   * Label of the autocomplete component.
   * @group Props
   */
  @Input() label = '';

  /**
   * Placeholder text.
   * @group Props
   */
  @Input() placeholder = 'Please enter';

  /**
   * Bottom hint text.
   * @group Props
   */
  @Input() hint = '';

  /**
   * Returns the object directly rather than the value specified with optionValue.
   * @group Props
   */
  @Input() returnObject = true;

  /**
   * Specifies if multiple values can be selected.
   * @group Props
   */
  @Input() multiple = false;

  /**
   * Determines whether autocomplete is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Width of the autocomplete component, a number denoting pixels or a string.
   * @group Props
   */
  @Input() width: number | string = '100%';

  /**
   * Option for selecting all elements. Doesn't work with virtual scroll.
   * @group Props
   */
  @Input() selectAll = true;

  /**
   * Determines whether the chevron icon should be displayed.
   * @group Props
   */
  @Input() showChevron = true;

  /**
   * Determines whether the options should be filtered by aliases in addition to labels.
   * @group Props
   */
  @Input() withOptionsAliases = false;

  /**
   * Determines whether the options should be filtered by aliases in addition to labels only when no label match is found. Works only If withOptionsAliases is true.
   * @group Props
   */
  @Input() useOptionsAliasesWhenNoMatch = false;

  /**
   * Name of the alias field of an option. Needed only if withOptionsAliases is true.
   * @group Props
   */
  @Input() optionAlias = 'alias';

  /**
   * When selecting elements, they will appear in a form of a chip.
   * @group Props
   */
  @Input() chips = true;

  /**
   * Determines whether the chips can be directly removed.
   * @group Props
   */
  @Input() closableChips = true;

  /**
   * When enabled, a clear icon is displayed to clear the value.
   * @group Props
   */
  @Input() clearable = false;

  /**
   * Determines whether the dropdown list should open on clear.
   * @group Props
   */
  @Input() openOnClear = true;

  /**
   * An array of options.
   * @group Props
   */
  @Input() options = [] as any[];

  /**
   * If multiple, determines whether selected options should be ordered according to the initial order of the options.
   * @group Props
   */
  @Input() keepInitialOrder = false;

  /**
   * Name of the label field of an option.
   * @group Props
   */
  @Input() optionLabel = 'label';

  /**
   * Name of the value field of an option. Needed only if returnObject prop is false.
   * @group Props
   */
  @Input() optionValue = 'value';

  /**
   * Name of the info field of an option, shows the additional information text.
   * @group Props
   */
  @Input() optionInfo = 'info';

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
   * Icon before input value.
   * @group Props
   */
  @Input() prefixIcon: IconType = '';

  /**
   * Size of icon before input value, of type number or string or 'fill' or 'xsmall' or 'small' or 'normal' or 'large'.
   * @group Props
   */
  @Input() prefixIconSize: iconSizeType = '18px';

  /**
   * When enabled, a loading bar is displayed.
   * @group Props
   */
  @Input() loading = false;

  /**
   * Text to display when there is no data. Defaults to 'No results found'.
   * @group Props
   */
  @Input() emptyMessage = 'No results found';

  /**
   * Determines whether the empty message should be displayed.
   * @group Props
   */
  @Input() showEmptyMessage = true;

  /**
   * Determines whether only the elements within scrollable area should be added into the DOM.
   * @group Props
   */
  @Input() virtualScroll = false;

  /**
   * Determines how many additional elements to add to the DOM outside of the view.
   * @group Props
   */
  @Input() numToleratedItems = 10;

  /**
   * Externally set error message.
   * @group Props
   */
  @Input() externalError = '';

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
   * Max width of infoTooltip of type number denoting pixels or string.
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
   * Styling appearance of autocomplete input, it could be 'outlined', 'underlined' or 'borderless'.
   * @group Props
   */
  @Input() appearance: CpsAutocompleteAppearanceType = 'outlined';

  /**
   * Index of empty value in options array. Applicable only if multiple is false.
   * @group Props
   */
  @Input() emptyOptionIndex = -1;

  /**
   * Value of the autocomplete.
   * @group Props
   */
  @Input('value') _value: any = undefined;

  get value(): any {
    return this._value;
  }

  set value(value: any) {
    this._value = value;
    this.onChange(value);
  }

  /**
   * Callback to invoke on value change.
   * @param {any} any - value changed.
   * @group Emits
   */
  @Output() valueChanged = new EventEmitter<any>();

  /**
   * Callback to invoke when the component loses focus.
   * @param {any}
   * @group Emits
   */
  @Output() blurred = new EventEmitter();

  @ViewChild('autocompleteBox')
  autocompleteBox!: ElementRef;

  @ViewChild('autocompleteContainer')
  autocompleteContainer!: ElementRef;

  @ViewChild('virtualList')
  virtualList!: VirtualScroller;

  @ViewChild('optionsMenu')
  optionsMenu!: CpsMenuComponent;

  @ViewChild('optionsList')
  optionsList!: ElementRef;

  private _statusChangesSubscription: Subscription = new Subscription();

  error = '';
  cvtWidth = '';
  isOpened = false;
  inputText = '';
  filteredOptions = [] as any[];
  backspaceClickedOnce = false;
  activeSingle = false;
  optionHighlightedIndex = -1;

  virtualListHeight = 240;
  virtualScrollItemSize = 42;

  autocompleteBoxWidth = 0;
  resizeObserver: ResizeObserver;

  isTimePickerField = false;

  constructor(
    @Self() @Optional() private _control: NgControl,
    private _labelByValue: LabelByValuePipe
  ) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        if (entry?.target)
          this.autocompleteBoxWidth = (entry.target as any).offsetWidth;
      });
    });
  }

  ngOnInit() {
    this.filteredOptions = this.options;
    this.cvtWidth = convertSize(this.width);
    if (this.multiple && !this._value) {
      this._value = [];
    }

    if (!this.multiple && this._value === undefined) {
      this._value = this._getEmptyValue();
    }

    this._statusChangesSubscription = this._control?.statusChanges?.subscribe(
      () => {
        this._checkErrors();
      }
    ) as Subscription;

    this.recalcVirtualListHeight();
  }

  ngAfterViewInit(): void {
    this.resizeObserver.observe(this.autocompleteBox.nativeElement);
  }

  ngOnDestroy() {
    this._statusChangesSubscription?.unsubscribe();
    this.resizeObserver?.disconnect();
  }

  select(
    option: any,
    byValue: boolean,
    needClearInput = true,
    needFocusInput = true
  ): void {
    function includes(array: any[], val: any): boolean {
      return array?.some((item) => isEqual(item, val)) || false;
    }

    this.backspaceClickedOnce = false;
    const val = byValue
      ? option
      : this.returnObject
        ? option
        : option[this.optionValue];
    if (this.multiple) {
      let res = [] as any;
      if (includes(this.value, val)) {
        res = this.value.filter((v: any) => !isEqual(v, val));
      } else {
        if (this.keepInitialOrder) {
          this.options.forEach((o) => {
            const ov = this.returnObject ? o : o[this.optionValue];
            if (
              this.value.some((v: any) => isEqual(v, ov)) ||
              isEqual(val, ov)
            ) {
              res.push(ov);
            }
          });
        } else {
          const opt = this.options.find((o) => {
            return isEqual(val, this.returnObject ? o : o[this.optionValue]);
          });
          if (opt) {
            res = [
              ...this.value,
              this.returnObject ? opt : opt[this.optionValue]
            ];
          }
        }
      }
      this.updateValue(res);
    } else {
      this.updateValue(val);
    }

    if (needClearInput) {
      this._clearInput();
    }
    if (needFocusInput) {
      setTimeout(() => {
        this.focusInput();
      }, 0);
    }
  }

  onOptionClick(option: any) {
    this._clickOption(option);
  }

  toggleAll() {
    let res = [];
    if (this.value.length < this.options.length) {
      if (this.returnObject) {
        res = this.options;
      } else {
        this.options.forEach((o) => {
          res.push(o[this.optionValue]);
        });
      }
    }
    this.updateValue(res);
    setTimeout(() => {
      this.focusInput();
    }, 0);
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

  filterOptions(event: any) {
    if (!this.isOpened) {
      this._toggleOptions(true);
    }
    this._dehighlightOption();
    this.backspaceClickedOnce = false;
    const searchVal = (event?.target?.value || '').toLowerCase();

    let _filteredOptions = this.options.filter((o: any) => {
      let res = o[this.optionLabel].toLowerCase().includes(searchVal);
      if (
        !res &&
        this.withOptionsAliases &&
        !this.useOptionsAliasesWhenNoMatch
      ) {
        res = o[this.optionAlias]?.toLowerCase()?.includes(searchVal) || false;
      }
      return res;
    });

    if (
      _filteredOptions.length === 0 &&
      this.withOptionsAliases &&
      this.useOptionsAliasesWhenNoMatch
    ) {
      _filteredOptions = this.options.filter(
        (o: any) =>
          o[this.optionAlias]?.toLowerCase()?.includes(searchVal) || false
      );
    }

    this.filteredOptions = _filteredOptions;

    setTimeout(() => {
      this.recalcVirtualListHeight();
    });
  }

  writeValue(value: any) {
    this.value = value;
  }

  clear(event: any): void {
    event.stopPropagation();

    if (
      (!this.multiple && !this.isEmptyValue()) ||
      (this.multiple && this.value?.length > 0)
    ) {
      if (this.openOnClear) {
        this._toggleOptions(true);
      }
      const val = this.multiple ? [] : this._getEmptyValue();
      this.updateValue(val);
    }
    this._clearInput();
    this._dehighlightOption();
    setTimeout(() => {
      this.focusInput();
    }, 0);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}

  onBlur() {
    this._control?.control?.markAsTouched();
    this._checkErrors();
    this.blurred.emit();
  }

  onBeforeOptionsHidden() {
    this._confirmInput(this.inputText || '', false);
    this._closeAndClear();
    this.onBlur();
  }

  onBoxClick() {
    if (!this.multiple) {
      this.activeSingle = true;
      if (!this.inputText) this.inputText = this._getValueLabel();
      if (!this.isOpened) this.filteredOptions = this.options;
    }
    this._dehighlightOption();
    setTimeout(() => {
      this.focus();
    });
  }

  onContainerKeyDown(event: any) {
    const code = event.keyCode;
    // escape
    if (code === 27) {
      this._closeAndClear();
    }
    // enter
    else if (code === 13) {
      let idx = this.optionHighlightedIndex;
      if (
        this.multiple &&
        this.selectAll &&
        this.filteredOptions.length === this.options.length &&
        !this.virtualScroll
      ) {
        if (idx === 0) {
          this.toggleAll();
          return;
        } else idx--;
      }
      const option = this.filteredOptions[idx];
      if (this.filteredOptions.length !== this.options.length)
        this._dehighlightOption();
      this._clickOption(option);
    }
    // vertical arrows
    else if ([38, 40].includes(code)) {
      // Arrows navigation doesn't work with virtual scroll
      if (!this.virtualScroll) this._navigateOptionsByArrows(code === 38);
    }
  }

  onInputKeyDown(event: any) {
    const code = event.keyCode;
    // backspace
    if (code === 8) {
      this._removeLastValue();
      event.stopPropagation();
    }
    // enter
    else if (code === 13) {
      if (this.optionHighlightedIndex < 0) {
        this._confirmInput(event?.target?.value || '', true);
        event.stopPropagation();
      }
    } else if ([38, 40].includes(code)) {
      event.preventDefault();
    }
  }

  onChevronClick(event: any) {
    event.stopPropagation();

    if (this.isOpened) {
      this._closeAndClear();
    } else {
      this.onBoxClick();
    }
  }

  focusInput() {
    this.autocompleteContainer?.nativeElement?.querySelector('input')?.focus();
  }

  focus() {
    this.focusInput();
    this._toggleOptions(true);
  }

  recalcVirtualListHeight() {
    if (!this.virtualScroll) return;
    const currentLen = this.filteredOptions?.length || 0;
    this.virtualListHeight = Math.min(
      this.virtualScrollItemSize * currentLen,
      240
    );
  }

  isEmptyValue(): boolean {
    return (
      this.value === null ||
      this.value === undefined ||
      (typeof this.value === 'string' && this.value.trim() === '') ||
      Number.isNaN(this.value)
    );
  }

  private _getEmptyValue() {
    const option = this.options[this.emptyOptionIndex];
    return !option
      ? undefined
      : this.returnObject
        ? option
        : option[this.optionValue];
  }

  private _toggleOptions(show?: boolean): void {
    if (this.disabled || this.isOpened === show) return;

    this.backspaceClickedOnce = false;
    if (typeof show === 'boolean') {
      if (show) {
        this.optionsMenu.show({
          target: this.autocompleteBox.nativeElement
        });
      } else {
        this.optionsMenu.hide();
      }
    } else {
      this.optionsMenu.toggle({
        target: this.autocompleteBox.nativeElement
      });
    }

    this.isOpened = this.optionsMenu.isVisible();

    setTimeout(() => {
      if (this.isOpened && this.filteredOptions.length > 0) {
        this.recalcVirtualListHeight();

        const selected =
          this.optionsList.nativeElement.querySelector('.selected');
        if (selected) {
          selected.scrollIntoView({
            behavior: 'instant',
            block: 'nearest',
            inline: 'center'
          });
        } else if (this.virtualScroll && !this.isEmptyValue()) {
          let v: any;
          if (this.multiple) {
            if (this.value.length > 0) {
              v = this.value[0];
            }
          } else v = this.value;
          const idx = this.filteredOptions.findIndex((o) => isEqual(o, v));
          if (idx >= 0) this.virtualList.scrollToIndex(idx);
        }
      }
    });
  }

  private _clickOption(option: any) {
    this.select(option, false);
    if (!this.multiple) {
      this._toggleOptions(false);
    }
  }

  private _checkErrors(): void {
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

  private updateValue(value: any): void {
    if (!this.multiple && isEqual(value, this.value)) return;
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  private _getValueLabel() {
    return !this.isEmptyValue()
      ? this.returnObject
        ? this.value[this.optionLabel]
        : this._labelByValue.transform(
            this.value,
            this.options,
            this.optionValue,
            this.optionLabel
          )
      : '';
  }

  private _clearInput() {
    this.filteredOptions = this.options;
    this.inputText = '';
    this.activeSingle = false;
    this.recalcVirtualListHeight();
  }

  private _closeAndClear() {
    this._clearInput();
    this._toggleOptions(false);
    this._dehighlightOption();
  }

  private _getHTMLOptions() {
    return (this.optionsList.nativeElement.querySelectorAll(
      '.cps-autocomplete-options-option'
    ) || []) as any;
  }

  private _dehighlightOption(el?: HTMLElement) {
    if (el) el.classList.remove('highlighten');
    else {
      if (this.optionHighlightedIndex < 0) return;
      const optionItems = this._getHTMLOptions();
      optionItems[this.optionHighlightedIndex].classList.remove('highlighten');
      this.optionHighlightedIndex = -1;
    }
  }

  private _highlightOption(el: HTMLElement) {
    el.classList.add('highlighten');
    const parent = el.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    if (elRect.top < parentRect.top || elRect.bottom > parentRect.bottom) {
      el.scrollIntoView({
        block: 'nearest',
        inline: 'center'
      });
    }
  }

  private _navigateOptionsByArrows(up: boolean) {
    if (!this.isOpened) return;

    const optionItems = this._getHTMLOptions();
    const len = optionItems.length;
    if (len < 1) return;

    if (len === 1) {
      this.optionHighlightedIndex = 0;
      this._highlightOption(optionItems[0]);
      return;
    }

    if (up) {
      this._dehighlightOption(optionItems[this.optionHighlightedIndex]);
      this.optionHighlightedIndex =
        this.optionHighlightedIndex < 1
          ? len - 1
          : this.optionHighlightedIndex - 1;
      this._highlightOption(optionItems[this.optionHighlightedIndex]);
    } else {
      this._dehighlightOption(optionItems[this.optionHighlightedIndex]);
      this.optionHighlightedIndex = [-1, len - 1].includes(
        this.optionHighlightedIndex
      )
        ? 0
        : this.optionHighlightedIndex + 1;
      this._highlightOption(optionItems[this.optionHighlightedIndex]);
    }
  }

  private _confirmInput(searchVal: string, needFocusInput: boolean) {
    if (!this.isOpened) return;

    searchVal = searchVal.toLowerCase();
    if (!searchVal) {
      if (this.multiple) return;
      this.updateValue(this._getEmptyValue());
      this._closeAndClear();
      return;
    }

    const found = this.filteredOptions.find(
      (o: any) => o[this.optionLabel].toLowerCase() === searchVal
    );
    if (found) {
      this.select(found, false, true, needFocusInput);
      this._toggleOptions(this.multiple);
    } else {
      if (!this.multiple) {
        if (this.isTimePickerField && this.filteredOptions.length > 0) {
          this.select(this.filteredOptions[0], false, false, needFocusInput);
          this._toggleOptions(false);
        }
        this.inputText = this._getValueLabel();
        this.filteredOptions = this.options;
        return;
      }
    }

    this._clearInput();
  }

  private _removeLastValue() {
    if (!this.multiple || this.inputText) return;

    if (this.value?.length) {
      if (this.backspaceClickedOnce) {
        this.updateValue(
          this.value.filter(
            (v: any, index: number) => index !== this.value.length - 1
          )
        );

        this.backspaceClickedOnce = false;
      } else this.backspaceClickedOnce = true;
    } else this.backspaceClickedOnce = false;

    setTimeout(() => {
      this.focusInput();
    }, 0);
  }
}
