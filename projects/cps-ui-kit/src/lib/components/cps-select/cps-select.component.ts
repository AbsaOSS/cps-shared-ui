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
import { TooltipPosition } from '../../directives/cps-tooltip.directive';
import { CpsMenuComponent } from '../cps-menu/cps-menu.component';

export type CpsSelectAppearanceType = 'outlined' | 'underlined' | 'borderless';

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
   * Hint text for the select component.
   * @group Props
   */
  @Input() placeholder = 'Please select';

  /**
   * More hints about the select component.
   * @group Props
   */
  @Input() hint = '';
  @Input() returnObject = true; // if false, value will be option[optionValue]

  /**
   * Specifies if multiple values can be selected.
   * @group Props
   */
  @Input() multiple = false;

  /**
   * If it is true, it specifies that the component should be disabled.
   * @group Props
   */
  @Input() disabled = false;

  /**
   * Width of the select input field, of type number or string.
   * @group Props
   */
  @Input() width: number | string = '100%';

  /**
   * Options for selecting all element.
   * @group Props
   */
  @Input() selectAll = true; // doesn't work with virtual scroll

  /**
   * When selecting an element, it will appear in a form of a chip.
   * @group Props
   */
  @Input() chips = true;

  /**
   *Options for removing a selected chip element.
   * @group Props
   */
  @Input() closableChips = true;

  /**
   *Options for clearing input, when enabled, a clear icon is displayed to clear the value.
   * @group Props
   */
  @Input() clearable = false;

  @Input() openOnClear = true;

  /**
   * An array of options of type any in the select component.
   * @group Props
   */
  @Input() options = [] as any[];

  /**
   * The label or title of the options.
   * @group Props
   */
  @Input() optionLabel = 'label';
  @Input() optionValue = 'value'; // needed only if returnObject === false
  /**
   * More information about the options.
   * @group Props
   */
  @Input() optionInfo = 'info';

  /**
   *Options for hiding details.
   * @group Props
   */
  @Input() hideDetails = false;
  @Input() persistentClear = false;
  /**
   * Icon before input value.
   * @group Props
   */
  @Input() prefixIcon: IconType = '';

  /**
   * Size of icon before input value, of type number or string or value 'fill' or 'xsmall' or 'small' or 'normal' or 'large'.
   * @group Props
   */
  @Input() prefixIconSize: iconSizeType = '18px';

  /**
   *When enabled, a loading bar is displayed when data is being collected.
   * @group Props
   */
  @Input() loading = false;

  /**
   * Whether the data should be loaded on demand during scroll.
   * @group Props
   */
  @Input() virtualScroll = false;

  /**
   *When it is not an empty string, an info icon is displayed to show text for more info.
   * @group Props
   */
  @Input() infoTooltip = '';
  @Input() infoTooltipClass = 'cps-tooltip-content';
  /**
   * Size of infoTooltip, of type number or string.
   * @group Props
   */
  @Input() infoTooltipMaxWidth: number | string = '100%';
  @Input() infoTooltipPersistent = false;

  /**
   * Position of infoTooltip it can be "right" or "top" or "bottom" or "left".
   * @group Props
   */
  @Input() infoTooltipPosition: TooltipPosition = 'top';
  @Input() optionsClass = '';

  /**
   * Styling appearance of autocomplete input it can be "outlined" or "underlined" or "borderless".
   * @group Props
   */
  @Input() appearance: CpsSelectAppearanceType = 'outlined';

  /**
   * Value selected.
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
        } else if (this.virtualScroll && this.value) {
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
        this.options.forEach((o) => {
          const ov = this.returnObject ? o : o[this.optionValue];
          if (this.value.some((v: any) => isEqual(v, ov)) || isEqual(val, ov)) {
            res.push(ov);
          }
        });
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
      (!this.multiple && this.value) ||
      (this.multiple && this.value?.length > 0)
    ) {
      if (this.openOnClear) {
        this._toggleOptions(true);
      }
      const val = this.multiple ? [] : this.returnObject ? undefined : '';
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
