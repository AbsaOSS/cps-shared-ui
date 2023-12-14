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
  iconSizeType,
  IconType
} from '../cps-icon/cps-icon.component';
import { CpsChipComponent } from '../cps-chip/cps-chip.component';
import { CpsProgressLinearComponent } from '../cps-progress-linear/cps-progress-linear.component';
import { CpsInfoCircleComponent } from '../cps-info-circle/cps-info-circle.component';
import { LabelByValuePipe } from '../../pipes/internal/label-by-value.pipe';
import { CombineLabelsPipe } from '../../pipes/internal/combine-labels.pipe';
import { CheckOptionSelectedPipe } from '../../pipes/internal/check-option-selected.pipe';
import { find, isEqual } from 'lodash-es';
import {
  VirtualScroller,
  VirtualScrollerModule
} from 'primeng/virtualscroller';
import { CpsTooltipPosition } from '../../directives/cps-tooltip.directive';
import { CpsMenuComponent } from '../cps-menu/cps-menu.component';

export type CpsSelectAppearanceType = 'outlined' | 'underlined' | 'borderless';

/**
 * CpsSelectComponent is used to select items from a collection.
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
    CombineLabelsPipe,
    CheckOptionSelectedPipe,
    VirtualScrollerModule,
    CpsMenuComponent
  ],
  providers: [LabelByValuePipe, CombineLabelsPipe, CheckOptionSelectedPipe],
  selector: 'cps-select',
  templateUrl: './cps-select.component.html',
  styleUrls: ['./cps-select.component.scss']
})
export class CpsSelectComponent
  implements ControlValueAccessor, OnInit, AfterViewInit, OnDestroy
{
  /**
   * The label of the select component.
   * @group Props
   */
  @Input() label = '';

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
   * Whether the chips can be directly removed.
   * @group Props
   */
  @Input() closableChips = true;

  /**
   * When enabled, a clear icon is displayed to clear the value.
   * @group Props
   */
  @Input() clearable = false;

  /**
   * Whether the dropdown list should open on clear.
   * @group Props
   */
  @Input() openOnClear = true;

  /**
   * An array of options.
   * @group Props
   */
  @Input() options = [] as any[];

  /**
   * If multiple, defines whether selected options should be ordered according to the initial order of the options.
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
   * Whether the component should have persistent clear icon.
   * @group Props
   */
  @Input() persistentClear = false;

  /**
   * Icon before input value.
   * @group Props
   */
  @Input() prefixIcon: IconType = '';

  /**
   * Size of icon before input value, of type number or string or value 'fill', 'xsmall', 'small', 'normal' or 'large'.
   * @group Props
   */
  @Input() prefixIconSize: iconSizeType = '18px';

  /**
   * When enabled, a loading bar is displayed.
   * @group Props
   */
  @Input() loading = false;

  /**
   * Whether only the elements within scrollable area should be added into the DOM.
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
   * Whether the infoTooltip is persistent.
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

  @ViewChild('selectBox')
  selectBox!: ElementRef;

  @ViewChild('selectContainer')
  selectContainer!: ElementRef;

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
  optionHighlightedIndex = -1;

  virtualListHeight = 240;
  virtualScrollItemSize = 42;

  selectBoxWidth = 0;
  resizeObserver: ResizeObserver;

  constructor(@Self() @Optional() private _control: NgControl) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        if (entry?.target)
          this.selectBoxWidth = (entry.target as any).offsetWidth;
      });
    });
  }

  ngOnInit() {
    this.cvtWidth = convertSize(this.width);
    if (this.multiple && !this._value) {
      this._value = [];
    }

    this._statusChangesSubscription = this._control?.statusChanges?.subscribe(
      () => {
        this._checkErrors();
      }
    ) as Subscription;

    this._recalcVirtualListHeight();
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
        const selected =
          this.optionsList.nativeElement.querySelector('.selected');
        if (selected) {
          selected.scrollIntoView({
            behavior: 'instant',
            block: 'nearest',
            inline: 'center'
          });
        } else if (
          this.virtualScroll &&
          this.value !== undefined &&
          this.value !== null
        ) {
          let v: any;
          if (this.multiple) {
            if (this.value.length > 0) {
              v = this.value[0];
            }
          } else v = this.value;
          const idx = this.options.findIndex((o) => isEqual(o, v));
          if (idx >= 0) this.virtualList.scrollToIndex(idx);
        }
      }
    });
  }

  private _recalcVirtualListHeight() {
    if (!this.virtualScroll) return;
    const currentLen = this.options?.length || 0;
    this.virtualListHeight = Math.min(
      this.virtualScrollItemSize * currentLen,
      240
    );
  }

  select(option: any, byValue: boolean): void {
    function includes(array: any[], val: any): boolean {
      return array ? !!find(array, (item) => isEqual(item, val)) : false;
    }
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

  private _getHTMLOptions() {
    return (this.optionsList.nativeElement.querySelectorAll(
      '.cps-select-options-option'
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

  onBeforeOptionsHidden() {
    this._toggleOptions(false);
    this._dehighlightOption();
  }

  onBoxClick() {
    this._toggleOptions();
    this._dehighlightOption();
  }

  onKeyDown(event: any) {
    event.preventDefault();
    const code = event.keyCode;
    // escape
    if (code === 27) {
      this._toggleOptions(false);
      this._dehighlightOption();
    }
    // enter
    else if (code === 13) {
      let idx = this.optionHighlightedIndex;
      if (idx < 0) return;
      if (this.multiple && this.selectAll && !this.virtualScroll) {
        if (idx === 0) {
          this.toggleAll();
          return;
        } else idx--;
      }

      this._clickOption(this.options[idx]);
    }
    // vertical arrows
    else if ([38, 40].includes(code)) {
      // Arrows navigation doesn't work with virtual scroll
      if (!this.virtualScroll) this._navigateOptionsByArrows(code === 38);
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
  onChange = (event: any) => {};
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

  clear(event: any): void {
    event.stopPropagation();

    if (
      (!this.multiple && this.value !== undefined && this.value !== null) ||
      (this.multiple && this.value?.length > 0)
    ) {
      if (this.openOnClear) {
        this._toggleOptions(true);
      }
      const val = this.multiple ? [] : undefined;
      this.updateValue(val);
    }
    this._dehighlightOption();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledState(disabled: boolean) {}

  onBlur() {
    this._control?.control?.markAsTouched();
    this._checkErrors();
  }

  focus() {
    this.selectContainer?.nativeElement?.focus();
    this._toggleOptions(true);
  }
}
