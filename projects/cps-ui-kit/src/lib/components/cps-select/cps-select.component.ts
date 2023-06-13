import { CommonModule } from '@angular/common';
import {
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
import { convertSize } from '../../utils/size-utils';
import { CpsIconComponent, iconSizeType } from '../cps-icon/cps-icon.component';
import { CpsChipComponent } from '../cps-chip/cps-chip.component';
import { CpsProgressLinearComponent } from '../cps-progress-linear/cps-progress-linear.component';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { LabelByValuePipe } from '../../pipes/label-by-value.pipe';
import { CombineLabelsPipe } from '../../pipes/combine-labels.pipe';
import { CheckOptionSelectedPipe } from '../../pipes/check-option-selected.pipe';
import { find, isEqual } from 'lodash-es';

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
    CombineLabelsPipe,
    CheckOptionSelectedPipe
  ],
  selector: 'cps-select',
  templateUrl: './cps-select.component.html',
  styleUrls: ['./cps-select.component.scss']
})
export class CpsSelectComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  @Input() label = '';
  @Input() placeholder = 'Please select';
  @Input() hint = '';
  @Input() returnObject = true; // if false, value will be option[optionValue]
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
  @Input() optionValue = 'value'; // needed only if returnObject === false
  @Input() optionInfo = 'info';
  @Input() hideDetails = false;
  @Input() persistentClear = false;
  @Input() prefixIcon = '';
  @Input() prefixIconSize: iconSizeType = '18px';
  @Input() loading = false;

  @Input('value') _value: any = undefined;

  set value(value: any) {
    this._value = value;
    this.onChange(value);
  }

  get value(): any {
    return this._value;
  }

  @Output() valueChanged = new EventEmitter<any>();

  @ViewChild('selectContainer')
  selectContainer!: ElementRef;

  private _statusChangesSubscription: Subscription = new Subscription();

  error = '';
  cvtWidth = '';

  isOpened = false;

  optionHighlightedIndex = -1;

  constructor(@Self() @Optional() private _control: NgControl) {
    if (this._control) {
      this._control.valueAccessor = this;
    }
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
  }

  ngOnDestroy() {
    this._statusChangesSubscription?.unsubscribe();
  }

  private _toggleOptions(dd: HTMLElement, show?: boolean): void {
    if (this.disabled || !dd) return;
    if (typeof show === 'boolean') {
      if (show) dd.classList.add('active');
      else dd.classList.remove('active');
    } else dd.classList.toggle('active');

    this.isOpened = dd.classList.contains('active');

    if (this.isOpened) {
      const selected =
        this.selectContainer.nativeElement.querySelector('.selected');
      if (selected)
        selected.scrollIntoView({
          behavior: 'instant',
          block: 'nearest',
          inline: 'start'
        });
    }
  }

  // private _filterOptions() {
  //   if (!this.optionsFilter || !this.multiple) return;
  //   this.filteredOptions = this.options.filter((o) => {
  //     if (this.returnObject) {
  //       return !this.value.find((v: any) => v === o);
  //     }
  //     return !this.value.find((v: any) => v === o[this.optionValue]);
  //   });
  // }

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

  onOptionClick(option: any, dd: HTMLElement) {
    this._clickOption(option, dd);
  }

  private _clickOption(option: any, dd: HTMLElement) {
    this.select(option, false);
    if (!this.multiple) {
      this._toggleOptions(dd, false);
    }
  }

  private _getHTMLOptions() {
    return (
      this.selectContainer?.nativeElement?.querySelectorAll(
        '.cps-select-options-option'
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
      el.scrollIntoView({
        block: 'nearest',
        inline: 'start'
      });
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

  onClickOutside(dd: HTMLElement) {
    this._toggleOptions(dd, false);
    this._dehighlightOption();
  }

  onBoxClick(dd: HTMLElement) {
    this._toggleOptions(dd);
    this._dehighlightOption();
  }

  onKeyDown(event: any, dd: HTMLElement) {
    event.preventDefault();
    const code = event.keyCode;
    // escape
    if (code === 27) {
      this._toggleOptions(dd, false);
      this._dehighlightOption();
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

      this._clickOption(this.options[idx], dd);
    }
    // vertical arrows
    else if ([38, 40].includes(code)) {
      this._navigateOptionsByArrows(code === 38);
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
    this._toggleOptions(this.selectContainer?.nativeElement, true);
  }
}
