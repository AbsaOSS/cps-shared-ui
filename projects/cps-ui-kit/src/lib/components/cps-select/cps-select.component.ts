import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self,
  ViewChild,
  type SimpleChanges
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NgControl,
  Validators
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { convertSize } from '../../utils/internal/size-utils/size-utils';
import {
  generateUniqueId,
  logMissingAriaLabelError
} from '../../utils/internal/accessibility-utils/accessibility-utils';
import {
  CpsIconComponent,
  iconSizeType,
  IconType
} from '../cps-icon/cps-icon.component';
import { CpsChipComponent } from '../cps-chip/cps-chip.component';
import { CpsProgressLinearComponent } from '../cps-progress-linear/cps-progress-linear.component';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import { LabelByValuePipe } from '../../pipes/internal/label-by-value/label-by-value.pipe';
import { CombineLabelsPipe } from '../../pipes/internal/combine-labels/combine-labels.pipe';
import { CheckOptionSelectedPipe } from '../../pipes/internal/check-option-selected/check-option-selected.pipe';
import { isEqual } from 'lodash-es';
import { CpsTooltipPosition } from '../../directives/cps-tooltip/cps-tooltip.directive';
import { CPS_ROOT_FONT_SIZE_SERVICE } from '../../services/cps-root-font-size/cps-root-font-size.service';
import {
  CpsMenuComponent,
  CpsMenuHideReason
} from '../cps-menu/cps-menu.component';
import { Scroller, ScrollerModule } from 'primeng/scroller';

/**
 * CpsSelectAppearanceType is used to define the border of the select input.
 * @group Types
 */
export type CpsSelectAppearanceType = 'outlined' | 'underlined' | 'borderless';

const VIRTUAL_SCROLL_ITEM_SIZE_REM = 2.75;
const VIRTUAL_SCROLL_MAX_VISIBLE_ITEMS = 5.5;

/**
 * CpsSelectComponent is used to select items from a collection.
 * @group Components
 */
@Component({
  imports: [
    CommonModule,
    FormsModule,
    CpsIconComponent,
    CpsChipComponent,
    CpsProgressLinearComponent,
    CpsInfoCircleComponent,
    LabelByValuePipe,
    CombineLabelsPipe,
    CheckOptionSelectedPipe,
    ScrollerModule,
    CpsMenuComponent
  ],
  providers: [LabelByValuePipe, CombineLabelsPipe, CheckOptionSelectedPipe],
  selector: 'cps-select',
  templateUrl: './cps-select.component.html',
  styleUrls: ['./cps-select.component.scss']
})
export class CpsSelectComponent
  implements ControlValueAccessor, OnInit, OnChanges, AfterViewInit, OnDestroy
{
  /**
   * Label of the select component.
   * @group Props
   */
  @Input() label = '';

  /**
   * Aria label for the select component, used for accessibility, it takes precedence over label.
   * @group Props
   */
  @Input() ariaLabel = '';

  /**
   * Placeholder text for the select component.
   * @group Props
   */
  @Input() placeholder = 'Please select';

  /**
   * Bottom hint text for the select component.
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
   * Specifies whether the component is disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Width of the select component, of type number denoting pixels or string.
   * @group Props
   */
  @Input() width: number | string = '100%';

  /**
   * Option for selecting all elements. Doesn't work with virtual scroll.
   * @group Props
   */
  @Input() selectAll = true;

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
  @Input() options: any[] = [];

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
   * Name of the icon field of an option, shows the icon.
   * @group Props
   */
  @Input() optionIcon = 'icon';

  /**
   * Name of the icon color field of an option, sets the icon color.
   * @group Props
   */
  @Input() optionIconColor = 'iconColor';

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
   * Size of icon before input value.
   * @group Props
   */
  @Input() prefixIconSize: iconSizeType = '1.125rem';

  /**
   * When enabled, a loading bar is displayed.
   * @group Props
   */
  @Input() loading = false;

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
   * Class for additional styling of the dropdown list.
   * @group Props
   */
  @Input() optionsClass = '';

  /**
   * Styling appearance of select input, it can be 'outlined', 'underlined' or 'borderless'.
   * @group Props
   */
  @Input() appearance: CpsSelectAppearanceType = 'outlined';

  /**
   * Determines whether the chevron icon should be displayed.
   * @group Props
   */
  @Input() showChevron = true;

  /**
   * Value of the select component.
   * @group Props
   */
  @Input('value') _value: any = undefined;

  set value(value: any) {
    this._value = value;
    this.onChange(value);
  }

  get value(): any {
    return this._value;
  }

  /**
   * Callback to invoke on value change.
   * @param {any} any - value changed.
   * @group Emits
   */
  @Output() valueChanged = new EventEmitter<any>();

  /**
   * Callback to invoke when the component receives focus.
   * @param {any}
   * @group Emits
   */
  @Output() focused = new EventEmitter();

  /**
   * Callback to invoke when the component loses focus.
   * @param {any}
   * @group Emits
   */
  @Output() blurred = new EventEmitter();

  @ViewChild('selectBox')
  selectBox!: ElementRef;

  @ViewChild('selectContainer')
  selectContainer!: ElementRef;

  @ViewChild('virtualList')
  virtualList!: Scroller;

  @ViewChild('optionsMenu')
  optionsMenu!: CpsMenuComponent;

  @ViewChild('optionsList')
  optionsList!: ElementRef;

  private _statusChangesSubscription?: Subscription;

  error = '';
  cvtWidth = '';
  isOpened = false;
  isActive = false;
  optionHighlightedIndex = -1;
  isArrowNavigating = false;

  readonly virtualScrollItemSizePx = computed(
    () =>
      (this._cpsRootFontSizeService?.fontSize() || 16) *
      VIRTUAL_SCROLL_ITEM_SIZE_REM
  );

  virtualListHeightRem =
    VIRTUAL_SCROLL_ITEM_SIZE_REM * VIRTUAL_SCROLL_MAX_VISIBLE_ITEMS;

  selectBoxWidthPx = 0;
  resizeObserver: ResizeObserver;

  private readonly _cpsRootFontSizeService = inject(CPS_ROOT_FONT_SIZE_SERVICE);

  readonly optionsListId = generateUniqueId('cps-select-options-list');
  readonly selectAllOptionId = generateUniqueId('cps-select-option-select-all');
  readonly hintId = generateUniqueId('cps-select-hint');
  readonly errorId = generateUniqueId('cps-select-error');

  get describedBy(): string | null {
    if (this.hideDetails) return null;
    if (this.error) return this.errorId;
    if (this.hint) return this.hintId;
    return null;
  }

  private readonly _optionIdPrefix = generateUniqueId('cps-select-option');
  private _optionIds = new WeakMap<object, string>();

  constructor(@Self() @Optional() private _control: NgControl) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        if (entry?.target)
          this.selectBoxWidthPx = (entry.target as any).offsetWidth;
      });
    });
  }

  ngOnInit() {
    this.virtualListHeightRem =
      VIRTUAL_SCROLL_ITEM_SIZE_REM * VIRTUAL_SCROLL_MAX_VISIBLE_ITEMS;
    this.cvtWidth = convertSize(this.width);
    if (this.multiple && !this._value) {
      this._value = [];
    }

    this._statusChangesSubscription = this._control?.statusChanges?.subscribe(
      () => {
        this._checkErrors();
      }
    );

    this.recalcVirtualListHeight();

    logMissingAriaLabelError('CpsSelectComponent', this.label, this.ariaLabel);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.width) {
      this.cvtWidth = convertSize(this.width);
    }
    if (changes.options) {
      this._optionIds = new WeakMap<object, string>();
      this.options.forEach((opt, index) => {
        if (opt && typeof opt === 'object') {
          this._optionIds.set(opt, this._buildOptionId(index));
        }
      });
      this.recalcVirtualListHeight();
    }

    logMissingAriaLabelError('CpsSelectComponent', this.label, this.ariaLabel);
  }

  ngAfterViewInit(): void {
    this.resizeObserver.observe(this.selectBox.nativeElement);
  }

  ngOnDestroy() {
    this._statusChangesSubscription?.unsubscribe();
    this.resizeObserver?.disconnect();
  }

  private _toggleOptions(show?: boolean): void {
    if (this.disabled || this.isOpened === show) return;

    if (typeof show === 'boolean') {
      if (show) {
        this.optionsMenu.show({
          target: this.selectBox.nativeElement
        });
      } else {
        this.optionsMenu.hide();
      }
    } else {
      this.optionsMenu.toggle({
        target: this.selectBox.nativeElement
      });
    }

    this.isOpened = this.optionsMenu.isVisible();

    setTimeout(() => {
      if (this.isOpened && this.options.length > 0) {
        this._syncHighlightToValue();
        const selected =
          this.optionsList.nativeElement.querySelector('.selected');
        if (selected) {
          selected.scrollIntoView({
            behavior: 'instant',
            block: 'nearest',
            inline: 'start'
          });
        } else if (this.virtualScroll && this.optionHighlightedIndex >= 0) {
          this._scrollVirtualListToIndex(this.optionHighlightedIndex);
        }
      }
    });
  }

  recalcVirtualListHeight() {
    if (!this.virtualScroll) return;
    const currentLen = this.options?.length || 0;
    this.virtualListHeightRem =
      VIRTUAL_SCROLL_ITEM_SIZE_REM *
      Math.min(currentLen, VIRTUAL_SCROLL_MAX_VISIBLE_ITEMS);
    this.virtualList?.setSpacerSize();
  }

  select(option: any, byValue: boolean): void {
    function includes(array: any[], val: any): boolean {
      return array?.some((item) => isEqual(item, val)) || false;
    }
    const val = byValue
      ? option
      : this.returnObject
        ? option
        : option[this.optionValue];
    if (this.multiple) {
      let res = [];
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
  }

  onOptionClick(option: any) {
    this._clickOption(option);
  }

  private _clickOption(option: any) {
    this.select(option, false);
    if (!this.multiple) {
      this._toggleOptions(false);
    }
  }

  private _dehighlightOption() {
    this.optionHighlightedIndex = -1;
    this.isArrowNavigating = false;
  }

  private _syncHighlightToValue(): void {
    if (!this.hasSelectedValue()) return;

    const firstSelected = this.multiple ? this.value[0] : this.value;
    const idx = this.options.findIndex((o) =>
      isEqual(this.returnObject ? o : o[this.optionValue], firstSelected)
    );
    if (idx < 0) return;

    this.optionHighlightedIndex = idx + (this.isSelectAllVisible ? 1 : 0);
  }

  private _highlightOption(el: HTMLElement) {
    const parent = el.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    if (elRect.top < parentRect.top || elRect.bottom > parentRect.bottom) {
      el.scrollIntoView({
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }

  private _navigateOptionsByArrows(up: boolean) {
    if (!this.isOpened) return;

    if (this.optionsAriaSetSize < 1) return;

    this.isArrowNavigating = true;
    this.optionHighlightedIndex = this._nextHighlightIndex(
      up,
      this.optionsAriaSetSize
    );

    const activeId = this._getHighlightedOptionId();
    if (!activeId) return;

    const activeOption = this.optionsList?.nativeElement?.querySelector(
      `#${activeId}`
    ) as HTMLElement | null;

    if (activeOption) {
      this._highlightOption(activeOption);
    }
  }

  onBeforeOptionsHidden(reason: CpsMenuHideReason): void {
    if ([CpsMenuHideReason.SCROLL, CpsMenuHideReason.RESIZE].includes(reason)) {
      this._toggleOptions(false);
      return;
    }
    this._toggleOptions(false);
    this._dehighlightOption();
  }

  onBoxClick() {
    if (!this.isOpened) {
      this.selectContainer?.nativeElement?.focus();
      this._toggleOptions(true);
    }
    this._dehighlightOption();
  }

  onChevronClick(event: any) {
    event.stopPropagation();
    event.preventDefault();
    if (this.isOpened) {
      this._toggleOptions(false);
    } else {
      this.selectContainer?.nativeElement?.focus();
      this._toggleOptions(true);
    }
    this._dehighlightOption();
  }

  onContainerKeyDown(event: any) {
    const code = event.keyCode;
    // enter or space
    if (code === 13 || code === 32) {
      event.preventDefault();
      if (!this.isOpened) {
        this._toggleOptions(true);
        return;
      }
      let idx = this.optionHighlightedIndex;
      if (idx < 0) {
        this._toggleOptions(false);
        return;
      }
      if (this.isSelectAllVisible) {
        if (idx === 0) {
          this.toggleAll();
          return;
        } else idx--;
      }

      this._clickOption(this.options[idx]);
    }
    // vertical arrows
    else if ([38, 40].includes(code)) {
      event.preventDefault();
      if (!this.isOpened) {
        this._toggleOptions(true);
        return;
      }
      if (this.virtualScroll) {
        this._navigateVirtualOptionsByArrows(code === 38);
      } else {
        this._navigateOptionsByArrows(code === 38);
      }
    }
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

  writeValue(value: any) {
    this.value = value;
  }

  private updateValue(value: any): void {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  clear(event?: any): void {
    event?.stopPropagation();
    event?.preventDefault();

    const hadValue = this.hasSelectedValue();

    if (hadValue) {
      if (this.openOnClear) {
        this._toggleOptions(true);
      }
      const val = this.multiple ? [] : undefined;
      this.updateValue(val);
    }
    this._dehighlightOption();
    if (hadValue) {
      setTimeout(() => {
        this.selectContainer?.nativeElement?.focus();
      }, 0);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(_disabled: boolean) {}

  onBlur() {
    this.isActive = false;
    if (this.isOpened) {
      this._toggleOptions(false);
      this._dehighlightOption();
    }
    this._checkErrors();
    this.blurred.emit();
  }

  onFocus() {
    if (!this.disabled) {
      this.isActive = true;
    }
    this._control?.control?.markAsTouched();
    this.focused.emit();
  }

  focus() {
    this.selectContainer?.nativeElement?.focus();
    this._toggleOptions(true);
  }

  get isRequired(): boolean {
    return this._control?.control?.hasValidator(Validators.required) ?? false;
  }

  get isSelectAllVisible(): boolean {
    return (
      !this.virtualScroll &&
      this.multiple &&
      this.selectAll &&
      this.options.length > 1
    );
  }

  get optionsAriaSetSize(): number {
    return this.options.length + (this.isSelectAllVisible ? 1 : 0);
  }

  get activeDescendantId(): string | null {
    if (!this.isOpened || this.optionHighlightedIndex < 0) {
      return null;
    }
    return this._getHighlightedOptionId();
  }

  getOptionAriaPosInSet(itemIndex: number): number {
    return itemIndex + 1 + (this.isSelectAllVisible ? 1 : 0);
  }

  getOptionId(option: any, index: number): string {
    if (option && typeof option === 'object') {
      return this._optionIds.get(option) || this._buildOptionId(index);
    }
    return this._buildOptionId(index);
  }

  private _buildOptionId(index: number): string {
    return `${this._optionIdPrefix}-${index}`;
  }

  private _getHighlightedOptionId(): string | null {
    if (this.isSelectAllVisible && this.optionHighlightedIndex === 0) {
      return this.selectAllOptionId;
    }
    const optionIndex =
      this.optionHighlightedIndex - (this.isSelectAllVisible ? 1 : 0);
    const activeOption = this.options[optionIndex];
    if (!activeOption) {
      return null;
    }
    return this.getOptionId(activeOption, optionIndex);
  }

  hasSelectedValue(): boolean {
    if (this.multiple) {
      return this.value?.length > 0;
    }
    return (
      this.value != null &&
      !(typeof this.value === 'string' && this.value.trim() === '') &&
      !Number.isNaN(this.value)
    );
  }

  private _navigateVirtualOptionsByArrows(up: boolean) {
    if (!this.isOpened) return;

    const len = this.options.length;
    if (len < 1) return;

    this.isArrowNavigating = true;
    this.optionHighlightedIndex = this._nextHighlightIndex(up, len);
    this._scrollVirtualListToIndex(this.optionHighlightedIndex);
  }

  private _nextHighlightIndex(up: boolean, len: number): number {
    if (up) {
      return this.optionHighlightedIndex < 1
        ? len - 1
        : this.optionHighlightedIndex - 1;
    }
    return [-1, len - 1].includes(this.optionHighlightedIndex)
      ? 0
      : this.optionHighlightedIndex + 1;
  }

  private _scrollVirtualListToIndex(index: number) {
    const scrollerEl = this.optionsList?.nativeElement?.querySelector(
      '.p-virtualscroller'
    ) as HTMLElement | null;
    if (!scrollerEl) {
      this.virtualList?.scrollToIndex(index);
      return;
    }

    const itemTop = index * this.virtualScrollItemSizePx();
    const itemBottom = itemTop + this.virtualScrollItemSizePx();

    const viewportTop = scrollerEl.scrollTop;
    const viewportBottom = viewportTop + scrollerEl.clientHeight;

    let nextTop = viewportTop;
    if (itemTop < viewportTop) {
      nextTop = itemTop;
    } else if (itemBottom > viewportBottom) {
      nextTop = itemBottom - scrollerEl.clientHeight;
    }

    if (nextTop === viewportTop) return;

    const maxTop = Math.max(
      0,
      scrollerEl.scrollHeight - scrollerEl.clientHeight
    );
    scrollerEl.scrollTop = Math.min(Math.max(0, nextTop), maxTop);
  }
}
