import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { convertSize } from '../../utils/size-utils';
import { CpsIconComponent, iconSizeType } from '../cps-icon/cps-icon.component';
import { CpsChipComponent } from '../cps-chip/cps-chip.component';
import { CpsProgressLinearComponent } from '../cps-progress-linear/cps-progress-linear.component';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { LabelByValuePipe } from '../../pipes/label-by-value.pipe';
import { CombineLabelsPipe } from '../../pipes/combine-labels.pipe';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ClickOutsideDirective,
    CpsIconComponent,
    CpsChipComponent,
    CpsProgressLinearComponent,
    LabelByValuePipe,
    CombineLabelsPipe
  ],
  providers: [LabelByValuePipe],
  selector: 'cps-autocomplete',
  templateUrl: './cps-autocomplete.component.html',
  styleUrls: ['./cps-autocomplete.component.scss']
})
export class CpsAutocompleteComponent
  implements ControlValueAccessor, OnInit, OnDestroy, OnChanges
{
  @Input() label = '';
  @Input() placeholder = 'Please enter';
  @Input() hint = '';
  @Input() returnObject = true;
  @Input() multiple = false;
  @Input() disabled = false;
  @Input() width: number | string = '100%';
  @Input() selectAll = true;
  @Input() chips = true;
  @Input() closableChips = true;
  @Input() clearable = false;
  @Input() openOnClear = true;
  @Input() options = [] as any[];
  @Input() optionLabel = 'label';
  @Input() optionValue = 'value'; // works only if returnObject === false (TODO potentially can be of any type)
  @Input() optionInfo = 'info';
  @Input() hideDetails = false;
  @Input() persistentClear = false;
  @Input() prefixIcon = '';
  @Input() prefixIconSize: iconSizeType = '18px';
  @Input() loading = false;

  @Input('value') _value: any = undefined;

  set value(value: any) {
    value = this._convertValue(value);
    this._value = value;
    this.onChange(value);
  }

  get value(): any {
    return this._value;
  }

  @Output() valueChanged = new EventEmitter<any>();

  @ViewChild('autocompleteContainer')
  autocompleteContainer!: ElementRef;

  private _statusChangesSubscription: Subscription = new Subscription();

  error = '';
  cvtWidth = '';
  isOpened = false;
  inputText = '';
  filteredOptions = [] as any[];
  backspaceClickedOnce = false;
  activeSingle = false;
  optionHighlightedIndex = -1;

  constructor(
    @Self() @Optional() private _control: NgControl,
    private _labelByValue: LabelByValuePipe
  ) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // eslint-disable-next-line dot-notation
    if ('_value' in changes && changes['_value'].isFirstChange()) {
      this.value = this._convertValue(this.value);
    }
  }

  ngOnInit() {
    this.filteredOptions = this.options;
    this.cvtWidth = convertSize(this.width);
    if (this.multiple && !this._value) {
      this._value = [];
    }

    this._statusChangesSubscription = this._control?.statusChanges?.subscribe(
      () => {
        this._checkErrors();
      }
    ) as Subscription;
  }

  ngOnDestroy() {
    this._statusChangesSubscription?.unsubscribe();
  }

  private _toggleOptions(dd: HTMLElement, show?: boolean): void {
    if (this.disabled || !dd) return;
    this.backspaceClickedOnce = false;
    if (typeof show === 'boolean') {
      if (show) dd.classList.add('active');
      else dd.classList.remove('active');
    } else dd.classList.toggle('active');

    this.isOpened = dd.classList.contains('active');

    if (this.isOpened) {
      const selected =
        this.autocompleteContainer.nativeElement.querySelector('.selected');
      if (selected) selected.scrollIntoView();
    }
  }

  select(option: any, byValue: boolean): void {
    this.backspaceClickedOnce = false;
    const val = byValue
      ? option
      : this.returnObject
      ? option
      : option[this.optionValue];
    if (this.multiple) {
      let res = [] as any;
      if (this.value.includes(val)) {
        res = this.value.filter((v: any) => v !== val);
      } else {
        this.options.forEach((o) => {
          const ov = this.returnObject ? o : o[this.optionValue];
          if (this.value.some((v: any) => v === ov) || val === ov) {
            res.push(ov);
          }
        });
      }
      this.updateValue(res);
    } else {
      this.updateValue(val);
    }
    this._clearInput();
    setTimeout(() => {
      this.focusInput();
    }, 0);
  }

  onOptionClick(option: any, dd: HTMLElement) {
    this._clickOption(option, dd);
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

  private _clickOption(option: any, dd: HTMLElement) {
    this.select(option, false);
    if (!this.multiple) {
      this._toggleOptions(dd, false);
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
      this._toggleOptions(this.autocompleteContainer?.nativeElement, true);
    }
    this.backspaceClickedOnce = false;
    const searchVal = (event?.target?.value || '').toLowerCase();

    this.filteredOptions = this.options.filter((o: any) =>
      o[this.optionLabel].toLowerCase().includes(searchVal)
    );
  }

  private _convertValue(value: any): any {
    if (!this.returnObject) {
      if (this.multiple) {
        if (Array.isArray(value)) {
          const temp: any = [];
          value.forEach((v) => {
            if (typeof v !== 'string') {
              temp.push(v ? v[this.optionValue] : '');
            } else temp.push(v);
          });
          value = temp;
        } else {
          if (!value) value = [];
          else {
            if (typeof value !== 'string') {
              value = [value[this.optionValue]];
            } else value = [value];
          }
        }
      } else {
        if (typeof value !== 'string') {
          value = value ? value[this.optionValue] : '';
        }
      }
    } else {
      if (this.multiple) {
        if (!Array.isArray(value)) {
          value = [value];
        }
      }
    }
    return value;
  }

  writeValue(value: any) {
    value = this._convertValue(value);
    this.value = value;
  }

  private updateValue(value: any): void {
    this.writeValue(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  private _getValueLabel() {
    return this.value
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

  clear(dd: HTMLElement, event: any): void {
    event.stopPropagation();

    if (
      (!this.multiple && this.value) ||
      (this.multiple && this.value?.length > 0)
    ) {
      if (this.openOnClear) {
        this._toggleOptions(dd, true);
      }
      const val = this.multiple ? [] : this.returnObject ? undefined : '';
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
  }

  private _clearInput() {
    this.filteredOptions = this.options;
    this.inputText = '';
    this.activeSingle = false;
  }

  private _closeAndClear(dd: HTMLElement) {
    this._clearInput();
    this._toggleOptions(dd, false);
    this._dehighlightOption();
  }

  onClickOutside(dd: HTMLElement) {
    this._closeAndClear(dd);
  }

  private _getHTMLOptions() {
    return (
      this.autocompleteContainer?.nativeElement?.querySelectorAll(
        '.cps-autocomplete-options-option'
      ) || []
    );
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
      el.scrollIntoView();
    }
  }

  onBoxClick() {
    if (!this.multiple) {
      this.activeSingle = true;
      this.inputText = this._getValueLabel();
      this.filteredOptions = this.options;
    }
    this.focus();
    this._dehighlightOption();
  }

  onContainerKeyDown(event: any, dd: HTMLElement) {
    const code = event.keyCode;
    // escape
    if (code === 27) {
      this._closeAndClear(dd);
    }
    // enter
    else if (code === 13) {
      let idx = this.optionHighlightedIndex;
      if (this.multiple && this.selectAll) {
        if (idx === 0) {
          this.toggleAll();
          return;
        } else idx--;
      }
      const option = this.filteredOptions[idx];
      this._clickOption(option, dd);
    }
    // vertical arrows
    else if ([38, 40].includes(code)) {
      this._navigateOptionsByArrows(code === 38);
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
        this._confirmInput(event?.target?.value || '');
        event.stopPropagation();
      }
    } else if ([38, 40].includes(code)) {
      event.preventDefault();
    } else {
      this._dehighlightOption();
    }
  }

  private _navigateOptionsByArrows(up: boolean) {
    if (!this.isOpened) return;

    const optionItems = this._getHTMLOptions();
    const len = optionItems.length;
    if (len < 1) return;

    if (len === 1) {
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

  private _confirmInput(searchVal: string) {
    if (!this.isOpened) return;
    searchVal = searchVal.toLowerCase();
    if (!searchVal) {
      if (this.multiple) return;
      const val = this.returnObject ? undefined : '';
      this.updateValue(val);
      this._closeAndClear(this.autocompleteContainer?.nativeElement);
      return;
    }

    const found = this.filteredOptions.find(
      (o: any) => o[this.optionLabel].toLowerCase() === searchVal
    );
    if (found) {
      this.select(found, false);
      this._toggleOptions(
        this.autocompleteContainer?.nativeElement,
        this.multiple
      );
    } else {
      if (!this.multiple) {
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

  focusInput() {
    this.autocompleteContainer?.nativeElement?.querySelector('input')?.focus();
  }

  focus() {
    this.autocompleteContainer?.nativeElement?.focus();
    this.focusInput();
    this._toggleOptions(this.autocompleteContainer?.nativeElement, true);
  }
}
